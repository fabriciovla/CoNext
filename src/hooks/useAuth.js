import { useCallback, useEffect, useState } from 'react'
import { useT } from '../lib/i18n.jsx'
import {
  authDisponible,
  clienteAuth,
  esProveedorOAuth,
  urlTrasOAuth,
  usuarioDeSesion,
} from '../lib/auth'
import { abrirOAuthAfuera, alVolverDeOAuth, esEscritorio } from '../lib/entorno'

const STORAGE_KEY = 'wsp-crm:user'

// La sesión se guarda en localStorage, igual que el tema. Es lo que había
// faltado la primera vez que se intentó el login: sin persistir, cada recarga
// devolvía al panel de inicio de sesión y no se podía trabajar.
//
// El correo + contraseña sigue siendo de mentira si no hay Supabase Auth: entra
// cualquiera, y quien tenga la consola abierta se pone la clave que quiera. Lo
// que autoriza de verdad las requests es la API key que inyecta el proxy de
// Vite. El login social (Google, GitHub) sí habla con Auth
// cuando están `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
function leerGuardado() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (!guardado) return null
    const parsed = JSON.parse(guardado)
    return parsed?.username ? parsed : null
  } catch {
    return null
  }
}

function leerTraspaso() {
  try {
    const url = new URL(window.location.href)
    const username = url.searchParams.get('u')?.trim()
    if (!username) return null
    url.searchParams.delete('u')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    return { username }
  } catch {
    return null
  }
}

function sesionLocal() {
  const traspaso = leerTraspaso()
  if (!traspaso) return leerGuardado()
  guardar(traspaso)
  return traspaso
}

// El `?u=` que deja la landing sirve para dos cosas distintas según haya o no
// Auth de verdad. Sin Auth *es* la sesión (arriba). Con Auth es apenas el correo
// que la persona ya escribió del otro lado: aparece escrito en el campo para no
// tipearlo dos veces, y nada más. La contraseña no viaja nunca por la URL, así
// que esa sí se pide de nuevo acá.
function correoDeTraspaso() {
  return leerTraspaso()?.username ?? ''
}

function guardar(sesion) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion))
  } catch {
    /* ver arriba: la sesión dura lo que dure la pestaña */
  }
}

function borrarGuardado() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ver arriba */
  }
}

export default function useAuth() {
  const social = authDisponible()
  // Un solo `useState` para las dos lecturas: `leerTraspaso` borra el `?u=` de
  // la URL, así que solo puede correr una vez y hay que decidir de entrada para
  // qué se usa lo que trajo.
  const [correoInicial] = useState(() => (social ? correoDeTraspaso() : ''))
  const [user, setUser] = useState(() => (social ? null : sesionLocal()))
  const [listo, setListo] = useState(!social)
  const t = useT()
  const [error, setError] = useState('')
  const [oauthPending, setOauthPending] = useState(false)
  const [entrando, setEntrando] = useState(false)

  const entrar = useCallback((sesion) => {
    setError('')
    setUser(sesion)
    guardar(sesion)
  }, [])

  const loginCon = useCallback(async (proveedor) => {
    if (!esProveedorOAuth(proveedor)) {
      setError(t('login.faltaProveedor'))
      return
    }
    const auth = clienteAuth()
    if (!auth) {
      setError(t('login.faltaSupabase'))
      return
    }
    setError('')
    setOauthPending(true)

    // Adentro de la app el login no puede pasar por esta ventana:
    // `skipBrowserRedirect` deja que Supabase arme la URL —y guarde de paso el
    // verifier del PKCE— sin navegar a ningún lado, y esa URL se abre en el
    // navegador del sistema. Navegar la ventana sería meter la pantalla de
    // Google adentro de un webview, que es justo lo que Google rechaza.
    const escritorio = esEscritorio()
    const { data, error: err } = await auth.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo: urlTrasOAuth(), skipBrowserRedirect: escritorio },
    })

    if (err) {
      setOauthPending(false)
      setError(err.message)
      return
    }

    if (escritorio && !(await abrirOAuthAfuera(data?.url))) {
      setOauthPending(false)
      setError(t('login.navegadorNoAbrio'))
    }
  }, [])

  useEffect(() => {
    if (!social) return undefined
    const auth = clienteAuth()
    if (!auth) {
      setListo(true)
      return undefined
    }

    const url = new URL(window.location.href)
    const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error')
    const proveedor = url.searchParams.get('oauth')
    if (oauthError || proveedor) {
      url.searchParams.delete('error')
      url.searchParams.delete('error_code')
      url.searchParams.delete('error_description')
      url.searchParams.delete('oauth')
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
    if (oauthError) setError(oauthError)

    let cancel = false
    auth.auth.getSession().then(({ data }) => {
      if (cancel) return
      const proximo = usuarioDeSesion(data.session)
      if (proximo) entrar(proximo)
      else if (proveedor) void loginCon(proveedor)
      setListo(true)
    })

    const { data } = auth.auth.onAuthStateChange((evento, session) => {
      if (evento === 'SIGNED_OUT') {
        setUser(null)
        borrarGuardado()
        return
      }
      const proximo = usuarioDeSesion(session)
      if (proximo) entrar(proximo)
    })

    return () => {
      cancel = true
      data.subscription.unsubscribe()
    }
  }, [social, entrar, loginCon])

  // La vuelta del proveedor cuando esto corre adentro de la app de escritorio.
  // Llega como `conext://auth?code=…`: el navegador terminó el login y el
  // proceso principal capturó el deep link. `detectSessionInUrl` no sirve acá
  // —el código nunca pasa por la URL de la página—, así que el canje se hace a
  // mano con `exchangeCodeForSession`.
  useEffect(() => {
    if (!social || !esEscritorio()) return undefined
    const auth = clienteAuth()
    if (!auth) return undefined

    let cancel = false

    const baja = alVolverDeOAuth(async (href) => {
      let parametros
      try {
        parametros = new URL(href).searchParams
      } catch {
        return
      }
      if (cancel) return
      setOauthPending(false)

      const fallo = parametros.get('error_description') || parametros.get('error')
      if (fallo) {
        setError(fallo)
        return
      }

      const code = parametros.get('code')
      if (!code) return

      const { data, error: err } = await auth.auth.exchangeCodeForSession(code)
      if (cancel) return
      if (err) {
        setError(err.message)
        return
      }
      const sesion = usuarioDeSesion(data.session)
      if (sesion) entrar(sesion)
    })

    // Si vuelve a la ventana sin haber terminado —cerró la pestaña, canceló en
    // el proveedor— los botones tienen que volver a andar. Sin esto quedan
    // apagados hasta reiniciar la app, sin que nada explique por qué.
    const volvio = () => setOauthPending(false)
    window.addEventListener('focus', volvio)

    return () => {
      cancel = true
      baja()
      window.removeEventListener('focus', volvio)
    }
  }, [social, entrar])

  // Con Supabase configurado esto es un ingreso de verdad: si la cuenta no
  // existe o la contraseña está mal, no se entra. Antes entraba cualquiera con
  // cualquier cosa, lo que en local era una molestia y publicado es una trampa
  // — la dashboard se dibujaba entera y después cada request moría con 401 sin
  // que nada dijera que la sesión no valía.
  //
  // Sin Supabase (un checkout local, una copia sin variables) se conserva el
  // atajo de antes: no hay a quién preguntarle, y bloquear la entrada dejaría
  // la dashboard inaccesible.
  const login = async (username, password) => {
    if (!username.trim() || !password.trim()) {
      setError(social ? t('login.faltanCredencialesSocial') : t('login.faltanCredenciales'))
      return
    }

    if (!social) {
      entrar({ username: username.trim() })
      return
    }

    const auth = clienteAuth()
    setError('')
    setEntrando(true)
    const { data, error: err } = await auth.auth.signInWithPassword({
      email: username.trim(),
      password,
    })
    setEntrando(false)

    if (err) {
      // El mensaje de Supabase viene en inglés y es el mismo para "no existe" y
      // para "contraseña equivocada", que es a propósito: decir cuál de las dos
      // fue le confirma a un tercero qué correos tienen cuenta.
      setError(
        err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : err.message,
      )
      return
    }

    const sesion = usuarioDeSesion(data.session)
    if (sesion) entrar(sesion)
  }

  const logout = () => {
    setUser(null)
    borrarGuardado()
    const auth = clienteAuth()
    if (auth) void auth.auth.signOut()
  }

  return {
    user,
    isAuthenticated: Boolean(user),
    listo,
    error,
    oauthPending,
    entrando,
    correoInicial,
    social,
    login,
    loginCon,
    logout,
    clearError: () => setError(''),
  }
}
