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
  // La promesa del módulo es la única compuerta. **No** alcanza con preguntar
  // si `window.FB` existe: el SDK define ese objeto apenas se ejecuta el
  // archivo, que es *antes* de que nadie haya llamado a `FB.init()`. Quien
  // pregunte en ese hueco se lleva un "ya está listo" falso, prende el botón y
  // termina llamando a `FB.login()` sobre un SDK sin inicializar — que no abre
  // el popup, no ejecuta el callback y no tira ningún error: la pantalla se
  // queda en "Conectando…" para siempre.
  //
  // Con un solo consumidor casi nunca pasaba. Con dos tarjetas en Configuración
  // —cada una esperando su propio /onboarding/config antes de pedir el SDK— la
  // segunda cae en ese hueco de manera bastante confiable.
  if (promesa) return promesa

  promesa = new Promise((resolve, reject) => {
    const iniciar = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version })
      resolve()
    }

    // El SDK ya está en la página: lo bajó una carga anterior de este módulo
    // (recarga en caliente de Vite) y `fbAsyncInit` no va a volver a dispararse.
    // Inicializar de nuevo es inofensivo y es lo único que garantiza que quede
    // inicializado de verdad antes de resolver.
    if (window.FB) return iniciar()

    window.fbAsyncInit = iniciar

    // El script ya se está bajando pero todavía no se ejecutó: no hay que
    // agregarlo otra vez, el `fbAsyncInit` de arriba lo va a resolver.
    if (document.getElementById('facebook-jssdk')) return

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
