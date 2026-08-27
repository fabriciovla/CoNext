// Destinos de los botones de la landing, juntos para no buscarlos por los
// componentes. El dominio es conext.lat.
//
// - APP_URL: la dashboard. En local, el Vite de la raíz (puerto 5173); en el
//   build, /app del mismo dominio. El form de /login manda para acá. El
//   cuestionario de /empezar también, cuando termina.
// - API_URL: el server Express. En local, puerto 3001. En el build, sale de
//   PUBLIC_API_URL (el POST de /altas). Sin eso, las respuestas solo quedan
//   en este navegador.
// - DODO_*: productos de test en Dodo Payments. Gratis es Estándar con
//   7 días de prueba (tarjeta al entrar, cobro el día 8). Estándar cobra
//   de una. Empresa sigue por WhatsApp. Cuando el pago o la prueba cierra,
//   Dodo vuelve a /empezar?plan=… El alta del tenant todavía no sale del
//   webhook: eso viene después.
// - GITHUB_URL: el perfil; en la barra va solo el isotipo, sin texto.
// - WHATSAPP_URL: wa.me quiere el número en dígitos, sin '+' ni espacios.
// - EMAIL: el que reciba las consultas. Conviene uno del dominio.
export const APP_URL = import.meta.env.DEV ? 'http://localhost:5173' : '/app'
export const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : import.meta.env.PUBLIC_API_URL || ''
export const GITHUB_URL = 'https://github.com/fabriciovla'
export const WHATSAPP_URL = 'https://wa.me/5490000000000'
export const EMAIL = 'contact@conext.lat'
export const SITE_URL = 'https://conext.lat'

export const ALTA_CLAVE = 'conext:alta'

// IDs de test_mode (dashboard Dodo). En live hay que recargar estos valores.
export const DODO_CHECKOUT = 'https://test.checkout.dodopayments.com/buy'
export const DODO_PRODUCTOS = {
  gratis: 'pdt_0NmHRaYv7Gz9lkRh4YM9f',
  estandar: 'pdt_0NmHQjxtUVwhPWsbCO5ty',
  premium: 'pdt_0NmHQk8uQC6xGJlZqNkmE',
}
export const DODO_ADDONS = {
  asientoMensual: 'adn_0NmHQjrEEBOMCLmnsTGDs',
  asientoAnual: 'adn_0NmHQjusu0ont4LZsqM81',
}

export function dodoCheckout(plan = 'gratis') {
  const productId = DODO_PRODUCTOS[plan]
  if (!productId) return '#'
  const url = new URL(`${DODO_CHECKOUT}/${productId}`)
  url.searchParams.set('redirect_url', `${SITE_URL}/empezar?plan=${plan}`)
  url.searchParams.set('metadata_plan', plan)
  return url.toString()
}
