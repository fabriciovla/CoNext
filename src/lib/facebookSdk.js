// El SDK de Facebook, cargado una sola vez para toda la app.
//
// Vivía adentro de `useWhatsappConnection`, que era el único que lo usaba.
// Ahora Configuración monta dos tarjetas que lo necesitan —WhatsApp y
// Meta— y esa versión no aguantaba dos llamadas: la segunda pisaba
// `window.fbAsyncInit` y devolvía una promesa que no resolvía nunca, así que el
// SDK terminaba avisándole solo al último que preguntó y el botón del otro
// quedaba deshabilitado para siempre, sin ningún error de por medio.
//
// Acá la promesa es del módulo: quien llegue segundo espera la misma y las dos
// pantallas se enteran cuando el SDK está listo.

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'

let promesa = null

export function cargarSdk(appId, version) {
  if (window.FB) return Promise.resolve()
  if (promesa) return promesa

  promesa = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version })
      resolve()
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = SDK_URL
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      // Se suelta la promesa fallada: si no, un corte de red momentáneo dejaría
      // el SDK marcado como "cargando" para el resto de la sesión y ningún
      // reintento posterior volvería a pedirlo.
      promesa = null
      reject(new Error('No se pudo cargar el SDK de Facebook'))
    }
    document.body.appendChild(script)
  })

  return promesa
}
