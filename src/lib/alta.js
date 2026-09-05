import { clienteAuth } from './auth'
import { esEscritorio } from './entorno'

// El corte de la entrada: quién ve la dashboard y quién va a parar a la
// encuesta.
//
// La pregunta es **si tiene un plan activo**, no si contestó el cuestionario.
// Y eso ya lo sabe contestar el server sin ningún endpoint nuevo: `/me` pasa
// por `resolveTenant`, que le da un negocio a quien es miembro de uno o tiene
// un pago de Dodo a su nombre —ahí mismo se lo provisiona— y responde
// `403 sin-tenant` a todo el resto. Un plan activo *es* tener un negocio.
//
// Por eso el corte vive acá y no en el login del sitio: ese formulario no
// autentica a nadie, solo le pasa el correo a la dashboard. Quién entró lo
// resuelve Supabase de este lado, y sin sesión no hay a quién preguntarle por
// su plan.
//
// Tres cosas que no hace, y a propósito:
//
// - **No corta sin sesión de Supabase.** El login de mentira no tiene cuenta
//   contra la cual preguntar, y en desarrollo `/me` lo resuelve la API key que
//   inyecta el proxy de Vite: ahí siempre hay negocio y eso es lo correcto.
// - **No corta en la app de escritorio.** La página vive en `app://conext`, que
//   no tiene un /empezar al lado, y mandar a alguien al navegador del sistema
//   en medio del ingreso es sacarlo de la app para que vuelva a entrar.
// - **No corta si la consulta falla.** Solo un `403 sin-tenant` explícito manda
//   a la encuesta; un 500, un 503 o la red caída dejan pasar. Es el mismo
//   criterio que `verificarTokenPagina` —un problema nuestro no se muestra como
//   un problema de la cuenta— y acá el costo de equivocarse es dejar a alguien
//   afuera de un CRM que sí pagó.

const API = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '') || '/api'

// De dónde sale el /empezar. Publicada, la dashboard cuelga de /app del mismo
// dominio que el sitio, así que alcanza con el origen propio; en desarrollo son
// dos servidores distintos y hace falta decirlo (VITE_SITE_URL).
const SITIO = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')

// Lo que hay que hacer después de esperar a que el pago llegue: volver a
// cargar la app. No alcanza con dejar entrar. Los hooks de la dashboard
// (`useProducts`, `useAgents`, `useSettings`, `useTemplates`) consultan **una
// sola vez** al montar, y montan con el resto de `App`, o sea que ya se
// comieron el 403 de cuando todavía no había negocio: dejarlos así muestra una
// dashboard recién comprada sin agentes, sin catálogo y sin configuración.
export const RECARGAR = 'recargar'

// Cada cuánto se vuelve a preguntar, en milisegundos, mientras se espera que
// llegue el pago. Arranca corto porque el webhook de Dodo suele tardar un
// segundo o dos, y se va estirando: si a los veinte segundos no llegó, no está
// por llegar. La suma es lo que dura la pantalla de "preparando".
const REINTENTOS = [700, 1300, 2000, 3000, 4000, 5000, 5000]

const demora = (ms) => new Promise((resolver) => setTimeout(resolver, ms))

// No hace falta una reserva de "ya lo mandé una vez": `urlEncuesta` siempre
// pone `correo` y `sinplan` en la vuelta, y el atajo de `/empezar` que manda
// solo a la app (`propio` en Empezar.astro) se apaga apenas hay `correo` o
// `sinplan` en la URL. Así que la encuesta nunca rebota de nuevo hacia acá por
// sí sola, y no hay loop que frenar: cada carga de `/app` puede volver a
// preguntar sin riesgo de pasarse la pelota con la encuesta.

// `sinplan=1` es lo que hace que el cuestionario termine ofreciendo los precios
// en vez de mandar a la dashboard. Es cosmético y no autoriza nada: quien lo
// escriba a mano en la barra de direcciones consigue ver una tabla de precios.
function urlEncuesta(correo) {
  const url = new URL('/empezar', SITIO || window.location.origin)
  url.searchParams.set('correo', correo)
  url.searchParams.set('sinplan', '1')
  return url.toString()
}

// Qué plan se acaba de comprar, si la dirección lo dice. Lo pone el
// cuestionario al terminar y el atajo de `/empezar` cuando alguien que ya
// contestó vuelve del checkout.
//
// Se lo saca de la barra al leerlo, igual que el `?u=` del login: es una señal
// de *este* ingreso y no un estado que tenga que sobrevivir a una recarga. Si
// sobreviviera, la espera de abajo volvería a correr en cada F5 de alguien que
// nunca terminó de pagar.
function planDeLaVuelta() {
  try {
    const url = new URL(window.location.href)
    const plan = url.searchParams.get('plan')?.trim()
    if (!plan) return ''
    url.searchParams.delete('plan')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    return plan
  } catch {
    return ''
  }
}

// true **solo** cuando el server dice con todas las letras que esta cuenta no
// tiene negocio. Todo lo demás —la red caída, un 500, un 401— es false, que
// acá quiere decir "dejala entrar": ver el encabezado del archivo.
async function sinPlan(token) {
  try {
    const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok || res.status !== 403) return false
    const { codigo } = await res.json().catch(() => ({}))
    return codigo === 'sin-tenant'
  } catch {
    return false
  }
}

// Devuelve la URL de la encuesta si esta cuenta no tiene plan activo, `RECARGAR`
// si lo consiguió mientras esperábamos, y null en cualquier otro caso —incluido
// el de no poder averiguarlo—.
//
// `alEsperar` se prende mientras se espera al pago: sin eso la app se queda en
// blanco veinte segundos justo después de que alguien puso la tarjeta, que es
// el peor momento posible para no decir nada.
export async function encuestaPendiente(correo, { alEsperar } = {}) {
  if (!correo || esEscritorio()) return null

  const auth = clienteAuth()
  if (!auth) return null
  const token = (await auth.auth.getSession()).data.session?.access_token
  if (!token) return null

  // Se lee siempre, aunque después no se use: el parámetro se limpia de la
  // barra en la misma lectura, y dejarlo colgado haría que la próxima recarga
  // se creyera que viene de un checkout.
  const compro = planDeLaVuelta()

  if (!(await sinPlan(token))) return null
  if (!compro) return urlEncuesta(correo)

  // Acaba de pagar y todavía no tiene negocio. Casi siempre es lo mismo: el
  // webhook de Dodo todavía no llegó. El navegador vuelve del checkout en el
  // acto y el evento tarda unos segundos, así que preguntar una sola vez es
  // preguntar antes de tiempo — y la respuesta de esa única pregunta era
  // mandarlo de vuelta a la encuesta que acababa de contestar, con la tabla de
  // precios adelante, tres segundos después de haber pagado.
  //
  // Por eso acá se espera en vez de rebotar. Si el pago llega, el alta la hace
  // `resolveTenant` en el momento (`provisionarDesdeDodo`) y esto no tiene que
  // hacer nada más que volver a preguntar.
  alEsperar?.(true)
  try {
    for (const espera of REINTENTOS) {
      await demora(espera)
      if (!(await sinPlan(token))) return RECARGAR
    }
  } finally {
    alEsperar?.(false)
  }

  // Se esperó y no llegó. Puede ser un webhook demorado de verdad, o que el
  // correo del checkout no sea el de la cuenta con la que entró —lo único que
  // ata los dos lados—. La encuesta no vuelve a preguntar nada (ya contestó) y
  // lo deja en la pantalla que explica las dos cosas y ofrece reintentar.
  return urlEncuesta(correo)
}
