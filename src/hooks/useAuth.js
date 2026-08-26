import { useState } from 'react'

const STORAGE_KEY = 'wsp-crm:user'

// La sesión se guarda en localStorage, igual que el tema. Es lo que había
// faltado la primera vez que se intentó el login: sin persistir, cada recarga
// devolvía al panel de inicio de sesión y no se podía trabajar.
//
// Sigue siendo un login de mentira — cualquier usuario y contraseña entran, y
// quien tenga la consola abierta se pone la clave que quiera. Lo que autoriza
// de verdad las requests es la API key que inyecta el proxy de Vite; esto solo
// decide qué se muestra. Cuando haya login posta, se reemplaza este hook.
function leerGuardado() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (!guardado) return null
    const parsed = JSON.parse(guardado)
    return parsed?.username ? parsed : null
  } catch {
    // Modo incógnito con almacenamiento bloqueado, o un valor viejo que no
    // parsea: no es motivo para dejar la app en blanco.
    return null
  }
}

// La landing (`site/`) es la puerta de entrada y tiene su propio formulario.
// Como vive en otro origen, no puede dejarnos la sesión escrita: nos manda
// quién entró en `?u=`. Sin esto, entrar por la landing te deja frente a un
// segundo formulario idéntico.
//
// Se lo saca de la URL apenas se lee, para que no quede en la barra ni en el
// historial. Que se pueda escribir a mano no agrega un agujero que no exista:
// todo este login es de mentira y lo que autoriza las requests es la API key.
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

function sesionInicial() {
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

export default function useAuth() {
  const [user, setUser] = useState(sesionInicial)
  const [error, setError] = useState('')

  const login = (username, password) => {
    if (!username.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña.')
      return
    }
    const proximo = { username: username.trim() }
    setError('')
    setUser(proximo)
    guardar(proximo)
  }

  const logout = () => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ver arriba */
    }
  }

  // `clearError` lo llama el formulario al escribir: el aviso no puede quedar
  // contradiciendo un campo que ya se corrigió.
  return {
    user,
    isAuthenticated: Boolean(user),
    error,
    login,
    logout,
    clearError: () => setError(''),
  }
}
