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
//   7 días de prueba (tarjeta al entrar, cobro el día 8). Estándar y Premium
//   cobran de una, cada uno en mensual o anual. Empresa sigue por WhatsApp.
//   Cuando el pago o la prueba cierra, Dodo vuelve a /empezar?plan=… El alta
//   del tenant todavía no sale del webhook: eso viene después.
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
// Apex: host canónico y allowlist del checkout de Dodo. www redirige acá.
export const SITE_URL = 'https://conext.lat'

export const ALTA_CLAVE = 'conext:alta'

// IDs de live_mode (dashboard Dodo, marca Conext). Los de test son OTROS: Dodo
// mantiene los dos catálogos separados y un producto creado en test no cruza,
// ni siquiera dentro de la misma cuenta. Las tres cosas se mueven juntas —el
// host del checkout, estos ids y DODO_MODE del server—, porque un id de test
// contra el host de live responde 404, y al revés también.
//
// Esto COBRA PLATA DE VERDAD. Para probar el flujo sin cobrar hay que volver a
// los ids de test y al host de test a la vez, no a uno solo.
export const DODO_CHECKOUT = 'https://checkout.dodopayments.com/buy'

// Cada plan pagado es DOS productos en Dodo, no uno con un interruptor: el
// mensual y el anual son suscripciones con distinto período y distinto precio,
// así que cada una es su propio producto. El plan gratis es el Estándar con
// siete días de prueba, y por eso no tiene variante anual: lo que se elige en
// la prueba es a qué se convierte el día 8.
export const DODO_PRODUCTOS = {
  gratis: 'pdt_0NmL13mpvxgIGlZtpNuMk', // Estándar con 7 días de prueba
  estandar: 'pdt_0NmL13rbIg7EUGS16fNN6', // USD 49 / mes
  estandarAnual: 'pdt_0NmL13vMkVxxTOxZcILwh', // USD 468 / año
  premium: 'pdt_0NmL1409dPjyoTQsdr7bE', // USD 149 / mes
  premiumAnual: 'pdt_0NmL1446QjLDWsjZVZ0fS', // USD 1428 / año
}

// No están enganchados a ningún producto: la tabla de precios los nombra pero
// el checkout no los ofrece, y engancharlos los pondría a la venta en un lugar
// donde no se prometieron. Quedan creados para cuando la pantalla los ofrezca.
export const DODO_ADDONS = {
  asientoMensual: 'adn_0NmL1480wnLf3QV4SFahS', // USD 15 / mes
  asientoAnual: 'adn_0NmL14Bk4w0DxvA9qHm30', // USD 180 / año
}

// El período viaja en el nombre de la clave (estandarAnual) y también en la
// metadata, que es de donde el webhook saca el plan sin tener que mapear
// product_id a mano en los dos extremos.
export function dodoCheckout(plan = 'gratis', periodo = 'mensual') {
  const clave = periodo === 'anual' && plan !== 'gratis' ? `${plan}Anual` : plan
  const productId = DODO_PRODUCTOS[clave]
  if (!productId) return '#'
  const url = new URL(`${DODO_CHECKOUT}/${productId}`)
  url.searchParams.set('redirect_url', `${SITE_URL}/empezar?plan=${plan}`)
  url.searchParams.set('metadata_plan', plan)
  url.searchParams.set('metadata_periodo', periodo)
  return url.toString()
}
