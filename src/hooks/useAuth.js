import { useState } from 'react'

// Login suspendido por ahora: al no persistir sesión, cada recarga volvía
// al panel de inicio de sesión. Arranca autenticado por defecto.
// Para reactivar el login, volver `user` inicial a `null`.
export default function useAuth() {
  const [user, setUser] = useState({ username: 'admin' })
  const [error, setError] = useState('')

  const login = (username, password) => {
    if (!username.trim() || !password.trim()) {
      setError('Ingresá usuario y contraseña.')
      return false
    }
    setError('')
    setUser({ username })
    return true
  }

  const logout = () => {
    setUser(null)
  }

  return { user, isAuthenticated: Boolean(user), error, login, logout }
}
