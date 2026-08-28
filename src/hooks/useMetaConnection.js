import { useCallback, useEffect, useRef, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
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

  const conectar = useCallback(() => {
    if (!window.FB) {
      setError('El conector de Meta todavía no está listo.')
      return
    }

    setError(null)
    setAvisos([])
    setPaginas([])
    tokenRef.current = null
    setConectando(true)

    window.FB.login(
      async (response) => {
        // Mismo diagnóstico que el de Embedded Signup, y por el mismo motivo:
        // cuando el popup termina y no pasa nada, lo único que distingue "Meta
        // dijo que no" de "Meta contestó algo que no entendimos" es ver la
        // respuesta cruda. Si esta línea no aparece en la consola, el callback
        // no corrió: el popup quedó abierto (mostrando un error adentro) o el
        // navegador lo bloqueó.
        console.log('[meta-login] respuesta de FB.login', response)

        const accessToken = response?.authResponse?.accessToken
        if (!accessToken) {
          setConectando(false)
          setError(
            response?.status === 'not_authorized'
              ? 'No diste los permisos que la app necesita.'
              : 'No se completó la conexión: cerraste la ventana o no diste los permisos.',
          )
          return
        }

        try {
          // El server cambia el token corto por uno largo antes de listar: si
          // la persona se toma un rato en elegir la Página, el corto se vence
          // en el medio y la conexión fallaría recién en el paso siguiente.
          const r = await apiPost('/onboarding/meta/pages', { accessToken })
          tokenRef.current = r.accessToken

          if (r.paginas.length === 0) {
            setConectando(false)
            setError('Tu cuenta no administra ninguna Página de Facebook.')
            return
          }

          // Con una sola Página no hay nada que preguntar: preguntarlo sería
          // un paso de más para confirmar la única respuesta posible.
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
      { scope: config?.permisosMeta, return_scopes: true },
    )
  }, [config, conectarPagina])

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
    cancelarSeleccion,
    refrescar,
  }
}
