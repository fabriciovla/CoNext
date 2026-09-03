import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n.jsx'
import { apiGet, apiPost, apiPatch } from '../api/client'
import { cargarSdk } from '../lib/facebookSdk'

// Conexión de Instagram y Messenger, que son un solo trámite: los dos cuelgan
// de la misma Página de Facebook y se conectan con el mismo token.
//
// Es parecido a `useWhatsappConnection` pero con un paso más, y no por gusto.
// Embedded Signup elige el número adentro del popup de Meta, así que vuelve con
// la decisión tomada. Acá no: una persona puede administrar varias Páginas y
// hay que preguntarle cuál. Por eso son dos llamadas —listar y conectar— y por
// eso este flujo pide un token en vez de un código: con `response_type: 'code'`
// el navegador no recibe nada con qué listar, y el código vive 30 segundos, que
// no alcanza para mostrar un selector y esperar a que alguien elija.
export function useMetaConnection() {
  const [config, setConfig] = useState(null)
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [error, setError] = useState(null)
  const t = useT()
  const [avisos, setAvisos] = useState([])
  const [sdkListo, setSdkListo] = useState(false)
  // Las Páginas a elegir. Vacío = no hay nada que preguntar.
  const [paginas, setPaginas] = useState([])

  // El token largo que devolvió el server en el paso de listar, para el paso de
  // conectar. Va en un ref y no en estado por el mismo motivo que los datos del
  // signup de WhatsApp: lo lee un callback que capturó un render viejo.
  const tokenRef = useRef(null)

  const refrescar = useCallback(async () => {
    try {
      setEstado(await apiGet('/onboarding/meta/status'))
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

        if (cfg.metaConfigurado) {
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

  const conectarPagina = useCallback(
    async (pageId) => {
      setConectando(true)
      setError(null)
      try {
        const r = await apiPost('/onboarding/meta/connect', {
          accessToken: tokenRef.current,
          pageId,
        })
        setAvisos(r.avisos ?? [])
        setPaginas([])
        tokenRef.current = null
        await refrescar()
      } catch (err) {
        setError(err.message)
      } finally {
        setConectando(false)
      }
    },
    [refrescar],
  )

  // El cuerpo del callback vive acá afuera, y no adentro de `FB.login`, porque
  // **el SDK rechaza una función async**: le valida el tipo al callback y corta
  // con "Expression is of type asyncfunction, not function" antes de abrir
  // nada. Como acá hay `await`, la función async va aparte y a `FB.login` se le
  // pasa una común que la dispara. `useWhatsappConnection` nunca chocó con esto
  // porque su callback ya era sincrónico.
  const procesarLogin = useCallback(
    async (response) => {
      const accessToken = response?.authResponse?.accessToken
      if (!accessToken) {
        setConectando(false)
        setError(
          response?.status === 'not_authorized'
            ? t('canales.sinPermisos')
            : t('canales.sinPermisosOCerrada'),
        )
        return
      }

      try {
        // El server cambia el token corto por uno largo antes de listar: si la
        // persona se toma un rato en elegir la Página, el corto se vence en el
        // medio y la conexión fallaría recién en el paso siguiente.
        const r = await apiPost('/onboarding/meta/pages', { accessToken })
        tokenRef.current = r.accessToken

        if (r.paginas.length === 0) {
          setConectando(false)
          setError(t('canales.sinPaginas'))
          return
        }

        // Con una sola Página no hay nada que preguntar: preguntarlo sería un
        // paso de más para confirmar la única respuesta posible.
        if (r.paginas.length === 1) {
          await conectarPagina(r.paginas[0].id)
          return
        }

        setPaginas(r.paginas)
        setConectando(false)
      } catch (err) {
        setConectando(false)
        setError(err.message)
      }
    },
    [conectarPagina],
  )

  const conectar = useCallback(() => {
    if (!window.FB) {
      setError(t('canales.sdkNoListo'))
      return
    }

    setError(null)
    setAvisos([])
    setPaginas([])
    tokenRef.current = null
    setConectando(true)

    // `FB.login` puede tirar de entrada: el SDK cargado pero sin `FB.init`, o
    // un callback que no le gusta. Sin este catch la excepción se va por arriba
    // del onClick, `conectando` queda en true y la pantalla dice "Conectando…"
    // para siempre sin que nada explique por qué.
    try {
      window.FB.login(
        (response) => {
          // Diagnóstico: cuando el popup termina y no pasa nada, lo único que
          // distingue "Meta dijo que no" de "Meta contestó algo que no
          // entendimos" es ver la respuesta cruda.
          console.log('[meta-login] respuesta de FB.login', response)
          procesarLogin(response)
        },
        { scope: config?.permisosMeta, return_scopes: true },
      )
    } catch (err) {
      console.error('[meta-login] FB.login falló', err)
      setConectando(false)
      setError(`No se pudo abrir la ventana de Meta: ${err.message}`)
    }
  }, [config, procesarLogin])

  // Prender o apagar un canal. No toca la conexión: decide si el CRM procesa lo
  // que llega por ahí.
  //
  // Va optimista, como la asignación y las etiquetas de la bandeja: un
  // interruptor que se queda quieto hasta que conteste el server se siente
  // roto, y acá no hay pipeline de IA que pueda cambiar el valor por su cuenta
  // entre nuestra acción y la respuesta. Si el server rechaza, vuelve solo.
  const cambiarCanal = useCallback(async (canal, activo) => {
    const pisar = (valor) =>
      setEstado((prev) => (prev ? { ...prev, canales: { ...prev.canales, [canal]: valor } } : prev))

    pisar(activo)
    setError(null)

    try {
      const r = await apiPatch(`/onboarding/meta/canales/${canal}`, { activo })
      setEstado((prev) => (prev ? { ...prev, canales: r.canales } : prev))
    } catch (err) {
      pisar(!activo)
      setError(err.message)
    }
  }, [])

  const cancelarSeleccion = useCallback(() => {
    setPaginas([])
    tokenRef.current = null
  }, [])

  return {
    config,
    estado,
    cargando,
    conectando,
    error,
    avisos,
    sdkListo,
    paginas,
    conectar,
    conectarPagina,
    cambiarCanal,
    cancelarSeleccion,
    refrescar,
  }
}
