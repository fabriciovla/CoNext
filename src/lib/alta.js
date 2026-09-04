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

// Devuelve la URL de la encuesta si esta cuenta no tiene plan activo, y null en
// cualquier otro caso —incluido el de no poder averiguarlo—.
export async function encuestaPendiente(correo) {
  if (!correo || esEscritorio()) return null

  const auth = clienteAuth()
  if (!auth) return null
  const token = (await auth.auth.getSession()).data.session?.access_token
  if (!token) return null

  try {
    const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) return null
    // Solo este código. Un 401 es una sesión vencida —de eso se ocupa el
    // login—, y un 500 es un problema nuestro.
    if (res.status !== 403) return null
    const { codigo } = await res.json().catch(() => ({}))
    if (codigo !== 'sin-tenant') return null
  } catch {
    return null
  }

  return urlEncuesta(correo)
}
