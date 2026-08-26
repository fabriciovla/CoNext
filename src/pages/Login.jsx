import { useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo from '../components/ui/Logo'
import { IconBolt, IconLock, IconMoon, IconSparkles, IconSun } from '../components/ui/icons'

const PESTANAS = [
  { key: 'ingresar', label: 'Iniciar sesión' },
  { key: 'crear', label: 'Crear cuenta' },
]

const VENTAJAS = [
  { Icon: IconBolt, label: 'Respuesta al instante' },
  { Icon: IconSparkles, label: 'Borradores con IA' },
  { Icon: IconLock, label: 'Datos por cliente' },
]

// El panel de marca no se muestra abajo de lg: en una pantalla angosta, apilarlo
// arriba del formulario deja el campo de usuario debajo del pliegue.
function PanelMarca() {
  return (
    <section className="relative hidden overflow-hidden border-r border-tint/[0.07] bg-surface-card px-10 py-9 lg:flex lg:flex-col">
      {/* Dos resplandores de marca, arriba y abajo: entran lento y se quedan
          quietos. Son el único "fondo" del panel; el resto es la superficie. */}
      <div
        className="animate-fade-in pointer-events-none absolute -left-28 -top-32 h-[440px] w-[440px] rounded-full bg-accent-gradient opacity-[0.1] blur-[130px]"
        style={{ '--d': '120ms' }}
      />
      <div
        className="animate-fade-in pointer-events-none absolute -bottom-36 -right-24 h-[400px] w-[400px] rounded-full bg-accent-gradient opacity-[0.08] blur-[130px]"
        style={{ '--d': '220ms' }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        {/* El logotipo grande es el centro del panel. El retraso va en un
            envoltorio porque `Logo` solo acepta `className`. */}
        <div className="animate-scale-in" style={{ '--d': '140ms' }}>
          <Logo className="h-[68px] w-auto text-ink-primary" />
        </div>

        <h1
          className="animate-fade-up mt-12 max-w-[15ch] text-[34px] font-semibold leading-[1.15] tracking-tight text-ink-primary"
          style={{ '--d': '240ms' }}
        >
          Todo WhatsApp.
          <br />
          <span className="text-violet">Una sola bandeja.</span>
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-[42ch] text-[13.5px] leading-relaxed text-ink-muted"
          style={{ '--d': '300ms' }}
        >
          La IA clasifica cada mensaje, contesta lo seguro y te deja el resto redactado para revisar.
        </p>
      </div>

      <ul
        className="animate-fade-in relative flex items-center justify-center gap-6 text-[12px] text-ink-faint"
        style={{ '--d': '420ms' }}
      >
        {VENTAJAS.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Icon size={13} />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Login({ onLogin, error, onClearError, theme, onToggleTheme }) {
  const [tab, setTab] = useState('ingresar')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const refsPestanas = useRef([])

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin(username, password)
  }

  // El aviso de error se borra apenas se escribe: si no, se queda ahí
  // contradiciendo el campo que la persona ya corrigió, hasta el próximo envío.
  const editar = (asignar) => (e) => {
    asignar(e.target.value)
    onClearError?.()
  }

  const cambiarTab = (key) => {
    setTab(key)
    onClearError?.()
  }

  // Tabindex rotativo: al grupo se entra con Tab en la pestaña activa y de ahí
  // se pasa con las flechas. Sin esto hay que tabular por todas las pestañas
  // antes de llegar al formulario, que es lo que se quiere usar.
  const moverFoco = (e, i) => {
    const salto = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    const destino =
      salto !== undefined
        ? (i + salto + PESTANAS.length) % PESTANAS.length
        : e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? PESTANAS.length - 1
            : null
    if (destino === null) return
    // Las flechas dentro de un tablist mueven entre pestañas, no scrollean.
    e.preventDefault()
    cambiarTab(PESTANAS[destino].key)
    refsPestanas.current[destino]?.focus()
  }

  return (
    <div className="min-h-dvh bg-surface-page lg:grid lg:grid-cols-2">
      <PanelMarca />

      <section className="relative flex min-h-dvh items-center justify-center px-5 py-12 lg:min-h-0">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-200 hover:bg-tint/[0.06] hover:text-ink-primary"
          >
            {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
          </button>
        )}

        <div className="w-full max-w-[340px]">
          {/* El logotipo vuelve acá solo cuando el panel de marca no está. */}
          <div className="animate-fade-down mb-8 flex justify-center lg:hidden">
            <Logo className="h-5 w-auto text-ink-primary" />
          </div>

          <div
            role="tablist"
            aria-label="Acceso"
            className="animate-fade-up grid grid-cols-2 gap-1 rounded-xl border border-tint/[0.08] bg-tint/[0.03] p-1"
            style={{ '--d': '80ms' }}
          >
            {PESTANAS.map(({ key, label }, i) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls="panel-acceso"
                tabIndex={tab === key ? 0 : -1}
                ref={(el) => (refsPestanas.current[i] = el)}
                onClick={() => cambiarTab(key)}
                onKeyDown={(e) => moverFoco(e, i)}
                className={`h-8 rounded-lg text-[12.5px] font-medium transition-colors duration-150 ${
                  tab === key
                    ? 'bg-surface-card text-ink-primary shadow-card'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            id="panel-acceso"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="stagger mt-8"
            style={{ '--stagger-base': '100ms' }}
          >
            <h2 className="text-center text-[26px] font-semibold tracking-tight text-ink-primary">
              {tab === 'ingresar' ? 'Hola de nuevo' : 'Pedí tu acceso'}
            </h2>
            <p className="mb-6 mt-1.5 text-center text-[13px] leading-relaxed text-ink-muted">
              {tab === 'ingresar'
                ? 'Ingresá con tu usuario para entrar al panel.'
                : 'Las cuentas las da el dueño del negocio: pedile que te sume al equipo y vas a recibir tu usuario por correo.'}
            </p>

            {/* Los campos van adentro de una tarjeta y no sueltos sobre la página:
                el campo es transparente, así que sin superficie propia el borde de
                1px es lo único que lo separa del gris del fondo. */}
            {tab === 'ingresar' ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-tint/[0.07] bg-surface-card p-5 shadow-card"
              >
                <Input
                  id="username"
                  name="username"
                  label="Usuario"
                  placeholder="admin"
                  value={username}
                  onChange={editar(setUsername)}
                  autoComplete="username"
                />
                <Input
                  id="password"
                  name="password"
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={editar(setPassword)}
                  autoComplete="current-password"
                />

                {error && <p className="animate-pop-in text-xs text-status-critical">{error}</p>}

                <Button type="submit" className="w-full">
                  Iniciar sesión
                </Button>
              </form>
            ) : (
              <Button variant="secondary" className="w-full" onClick={() => cambiarTab('ingresar')}>
                Ya tengo una cuenta
              </Button>
            )}

            {tab === 'ingresar' && (
              <p className="mt-5 text-center text-xs text-ink-faint">
                Demo local — cualquier usuario y contraseña funcionan.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
