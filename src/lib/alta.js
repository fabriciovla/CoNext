import { esEscritorio } from './entorno'

// El corte de la encuesta de alta, del lado de la dashboard.
//
// El cuestionario de /empezar vive en el sitio, y quien entra por el formulario
// de correo de ahí ya queda cortado antes de salir. Lo que no puede cortar el
// sitio es el login social: Google y GitHub vuelven a /app y quién entró lo
// resuelve Supabase acá adentro, así que el correo recién se conoce de este
// lado. Este módulo es esa segunda mitad.
//
// Tres cosas que no hace, y a propósito:
//
// - No corta al login de mentira (usuario + contraseña sin Supabase). Ahí no
//   hay correo, solo un nombre escrito a mano, y no hay cuenta contra la cual
//   preguntar.
// - No corta en la app de escritorio. La página vive en `app://conext`, que no
//   tiene un /empezar al lado, y mandar a alguien al navegador del sistema en
//   medio del ingreso es sacarlo de la app para que vuelva a entrar.
// - No corta si la consulta falla. Solo un "no contestó" explícito manda a la
//   encuesta: con la API caída o mal configurada, la persona entra. Es el mismo
//   criterio que la tarjeta de conexión de Meta —un problema nuestro no se
//   muestra como un problema de la cuenta— y acá el costo sería peor, porque
//   deja a alguien afuera de su propio CRM.

const API = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '') || '/api'

// De dónde sale el /empezar. Publicada, la dashboard cuelga de /app del mismo
// dominio que el sitio, así que alcanza con el origen propio; en desarrollo son
// dos servidores distintos y hace falta decirlo (VITE_SITE_URL).
const SITIO = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '')

// Una sola vuelta a la encuesta por pestaña. Sin esto, un cuestionario que se
// contesta pero cuyo POST no llega —la API caída justo ahí— deja el alta sin
// guardar y la dashboard vuelve a mandar a /empezar apenas se entra: la persona
// contesta las cuatro preguntas en un bucle del que no se sale. La segunda vez
// entra, aunque el server siga diciendo que falta.
const CLAVE_REBOTE = 'wsp-crm:alta-rebote'

function yaRebotó(correo) {
  try {
    return sessionStorage.getItem(CLAVE_REBOTE) === correo
  } catch {
    // Sin sessionStorage no hay red de contención posible, y la alternativa
    // —no cortar nunca— desarma el corte entero. Se sigue de largo.
    return false
  }
}

function marcarRebote(correo) {
  try {
    sessionStorage.setItem(CLAVE_REBOTE, correo)
  } catch {
    /* ver yaRebotó */
  }
}

function urlEncuesta(correo) {
  const base = SITIO || window.location.origin
  const url = new URL('/empezar', base)
  url.searchParams.set('correo', correo)
  return url.toString()
}

// Devuelve la URL de la encuesta si esta cuenta todavía no la contestó, y null
// en cualquier otro caso —incluido el de no poder averiguarlo—.
export async function encuestaPendiente(correo) {
  if (!correo || esEscritorio() || yaRebotó(correo)) return null
  try {
    const res = await fetch(`${API}/altas/estado?correo=${encodeURIComponent(correo)}`)
    if (!res.ok) return null
    const { contesto } = await res.json()
    if (contesto) return null
    marcarRebote(correo)
    return urlEncuesta(correo)
  } catch {
    return null
  }
}
