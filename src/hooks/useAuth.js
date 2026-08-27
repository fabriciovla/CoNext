import { useCallback, useEffect, useState } from 'react'
import {
  authDisponible,
  clienteAuth,
  esProveedorOAuth,
  urlTrasOAuth,
  usuarioDeSesion,
} from '../lib/auth'

const STORAGE_KEY = 'wsp-crm:user'

// La sesión se guarda en localStorage, igual que el tema. Es lo que había
// faltado la primera vez que se intentó el login: sin persistir, cada recarga
// devolvía al panel de inicio de sesión y no se podía trabajar.
//
// El correo + contraseña sigue siendo de mentira si no hay Supabase Auth: entra
// cualquiera, y quien tenga la consola abierta se pone la clave que quiera. Lo
// que autoriza de verdad las requests es la API key que inyecta el proxy de
// Vite. El login social (Google, GitHub, Microsoft, Apple) sí habla con Auth
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
  const [user, setUser] = useState(() => (social ? null : sesionLocal()))
  const [listo, setListo] = useState(!social)
  const [error, setError] = useState('')
  const [oauthPending, setOauthPending] = useState(false)

  const entrar = useCallback((sesion) => {
    setError('')
    setUser(sesion)
    guardar(sesion)
  }, [])

  const loginCon = useCallback(async (proveedor) => {
    if (!esProveedorOAuth(proveedor)) {
      setError('Ese proveedor no está disponible.')
      return
    }
    const auth = clienteAuth()
    if (!auth) {
      setError('Falta configurar el login social en el server (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).')
      return
    }
    setError('')
    setOauthPending(true)
    const { error: err } = await auth.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo: urlTrasOAuth() },
    })
    if (err) {
      setOauthPending(false)
      setError(err.message)
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

  const login = (username, password) => {
    if (!username.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña.')
      return
    }
    entrar({ username: username.trim() })
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
    social,
    login,
    loginCon,
    logout,
    clearError: () => setError(''),
  }
}
