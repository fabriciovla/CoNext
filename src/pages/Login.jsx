import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login({ onLogin, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-page px-4">
      {/* Resplandor de marca detrás de la tarjeta: entra lento y se queda quieto. */}
      <div
        className="animate-fade-in pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-accent-gradient opacity-[0.13] blur-[110px]"
        style={{ '--d': '150ms' }}
      />

      <div className="relative w-full max-w-[360px]">
        <div className="animate-fade-down mb-7 flex items-center gap-3">
          <img src="/whatsapp.svg" alt="" className="h-10 w-10 rounded-xl" />
          <div>
            <p className="text-base font-semibold text-ink-primary">WhatsApp CRM</p>
            <p className="text-xs text-ink-muted">Ingresá para administrar tu tienda</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="stagger space-y-4 rounded-2xl border border-white/[0.06] bg-surface-card p-6 shadow-card"
          style={{ '--stagger-base': '120ms' }}
        >
          <Input
            id="username"
            label="Usuario"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <p className="animate-pop-in text-xs text-status-critical">{error}</p>}

          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>
        </form>

        <p className="animate-fade-in mt-4 text-center text-xs text-ink-muted" style={{ '--d': '420ms' }}>
          Demo local — cualquier usuario y contraseña funcionan.
        </p>
      </div>
    </div>
  )
}
