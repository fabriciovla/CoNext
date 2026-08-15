import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPost } from '../api/client'

// Embedded Signup: el cliente conecta su propio WhatsApp desde un popup de
// Meta, sin que nadie le pida un token por terminal.
//
// La parte incómoda es que el resultado llega **por dos vías separadas**:
//
//   1. un `postMessage` con el waba_id y el phone_number_id;
//   2. el callback de FB.login con el código de autorización.
//
// Ninguna trae todo, y el orden no está garantizado. Por eso los ids del paso 1
// se guardan en un ref y recién se manda al server cuando llega el código.
// Tiene que ir en un ref y no en estado: el callback de FB.login es una función
// vieja que capturó el render en el que se creó, y con `useState` leería
// siempre null.

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'

// El código de autorización vive 30 segundos. Suena a mucho y no lo es: si el
// server está frío o la conexión es lenta, se vence en el camino.
const AVISO_CODIGO_CORTO = 'El código de Meta vence a los 30 segundos. Probá de nuevo.'

function cargarSdk(appId, version) {
  if (window.FB) return Promise.resolve()

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version })
      resolve()
    }

    if (document.getElementById('facebook-jssdk')) return

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = SDK_URL
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Facebook'))
    document.body.appendChild(script)
  })
}

export function useWhatsappConnection() {
  const [config, setConfig] = useState(null)
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [error, setError] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [sdkListo, setSdkListo] = useState(false)

  const datosSignup = useRef(null)

  const refrescar = useCallback(async () => {
    try {
      setEstado(await apiGet('/onboarding/status'))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    let vivo = true

    ;(async () => {
      try {
        const cfg = await apiGet('/onboarding/config')
        if (!vivo) return
        setConfig(cfg)

        await refrescar()

        if (cfg.configurado) {
          await cargarSdk(cfg.appId, cfg.graphVersion)
          if (vivo) setSdkListo(true)
        }
      } catch (err) {
        if (vivo) setError(err.message)
      } finally {
        if (vivo) setCargando(false)
      }
    })()

    return () => {
      vivo = false
    }
  }, [refrescar])

  // El popup avisa por postMessage con qué cuenta y qué número eligió el
  // cliente. Se escucha siempre, no solo mientras el popup está abierto: el
  // mensaje puede llegar antes de que React reaccione a nada.
  useEffect(() => {
    function onMessage(event) {
      // Solo escuchamos a Meta. Sin esto, cualquier iframe de la página podría
      // mandar un mensaje falso y hacernos conectar un número ajeno.
      //
      // El parseo va en try/catch porque un popup puede mandar el origen como
      // "null" (origen opaco) y ahí `new URL` tira: una excepción dentro de un
      // listener de message se traga el resto y el mensaje bueno que venía
      // atrás nunca se procesa.
      let host
      try {
        host = new URL(event.origin).hostname
      } catch {
        return
      }
      if (!/(^|\.)facebook\.com$/.test(host)) return

      let payload
      try {
        payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return // ruido de otros scripts de Meta, no es lo nuestro
      }

      // Diagnóstico: cuando el popup termina pero los ids no llegan, lo único
      // que distingue "Meta no mandó nada" de "mandó algo que no entendimos" es
      // ver el mensaje crudo.
      console.log('[embedded-signup] mensaje de', event.origin, payload)

      if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return

      if (payload.event === 'FINISH') {
        datosSignup.current = {
          wabaId: payload.data?.waba_id ?? null,
          phoneNumberId: payload.data?.phone_number_id ?? null,
        }
      } else if (payload.event === 'CANCEL') {
        datosSignup.current = null
        setConectando(false)
        setError('Cancelaste la conexión antes de terminar.')
      } else if (payload.event === 'ERROR') {
        datosSignup.current = null
        setConectando(false)
        setError(payload.data?.error_message ?? 'Meta rechazó la conexión.')
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const enviarAlServer = useCallback(
    async (code) => {
      const datos = datosSignup.current

      if (!datos?.wabaId || !datos?.phoneNumberId) {
        setConectando(false)
        setError('Meta no devolvió el número elegido. Cerrá el popup y probá de nuevo.')
        return
      }

      try {
        const r = await apiPost('/onboarding/connect', { code, ...datos })
        setAvisos(r.avisos ?? [])
        await refrescar()
      } catch (err) {
        setError(err.message.includes('código') ? `${err.message} ${AVISO_CODIGO_CORTO}` : err.message)
      } finally {
        setConectando(false)
        datosSignup.current = null
      }
    },
    [refrescar],
  )

  const conectar = useCallback(() => {
    if (!window.FB || !config?.configId) {
      setError('El conector de Meta todavía no está listo.')
      return
    }

    setError(null)
    setAvisos([])
    datosSignup.current = null
    setConectando(true)

    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code
        if (!code) {
          setConectando(false)
          // Sin código puede ser que cerró el popup o que no dio los permisos.
          // El evento CANCEL del listener de arriba suele llegar antes y con un
          // mensaje mejor, así que este no lo pisa si ya hay uno.
          setError((previo) => previo ?? 'No se completó la conexión.')
          return
        }
        enviarAlServer(code)
      },
      {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        // `sessionInfoVersion: 3` es lo que hace que el popup devuelva el
        // waba_id y el phone_number_id por postMessage. Sin esto el flujo
        // termina bien y entrega el código, pero nunca sabés qué número eligió
        // el cliente — que es justo lo que estaba pasando.
        extras: { setup: {}, sessionInfoVersion: '3' },
      },
    )
  }, [config, enviarAlServer])

  return { config, estado, cargando, conectando, error, avisos, sdkListo, conectar, refrescar }
}
