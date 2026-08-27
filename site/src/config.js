// Destinos de los botones de la landing, juntos para no buscarlos por los
// componentes. El dominio es conext.lat.
//
// - APP_URL: la dashboard. En local, el Vite de la raíz (puerto 5173); en el
//   build, /app del mismo dominio. El form de /login manda para acá. El
//   cuestionario de /empezar también, cuando termina.
// - API_URL: el server Express. En local, puerto 3001. En el build, sale de
//   PUBLIC_API_URL (el POST de /altas). Sin eso, las respuestas solo quedan
//   en este navegador.
// - DODO_URL: el checkout de Dodo Payments. "Empezar gratis" y los planes
//   de Precios van acá; cuando el pago cierra, Dodo tiene que volver a
//   /empezar. Pegá el link cuando lo tengas — vacío, el botón no navega.
// - GITHUB_URL: el perfil; en la barra va solo el isotipo, sin texto.
// - WHATSAPP_URL: wa.me quiere el número en dígitos, sin '+' ni espacios.
// - EMAIL: el que reciba las consultas. Conviene uno del dominio.
export const APP_URL = import.meta.env.DEV ? 'http://localhost:5173' : '/app'
export const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : import.meta.env.PUBLIC_API_URL || ''
export const DODO_URL = ''
export const GITHUB_URL = 'https://github.com/fabriciovla'
export const WHATSAPP_URL = 'https://wa.me/5490000000000'
export const EMAIL = 'contact@conext.lat'

export const ALTA_CLAVE = 'conext:alta'

export function dodoCheckout(plan = 'gratis') {
  if (!DODO_URL) return '#'
  try {
    const url = new URL(DODO_URL)
    url.searchParams.set('plan', plan)
    return url.toString()
  } catch {
    return DODO_URL
  }
}
