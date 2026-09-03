import { useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Logo, { LogoMarca } from '../components/ui/Logo'
import SocialButtons from '../components/login/SocialButtons'
import { IconBolt, IconLock, IconMoon, IconSparkles, IconSun } from '../components/ui/icons'
import { useT } from '../lib/i18n.jsx'

const PESTANAS = [
  { key: 'ingresar', clave: 'login.iniciarSesion' },
  { key: 'crear', clave: 'login.crearCuenta' },
]

const VENTAJAS = [
  { Icon: IconBolt, clave: 'login.ventajaRespuesta' },
  { Icon: IconSparkles, clave: 'login.ventajaBorradores' },
  { Icon: IconLock, clave: 'login.ventajaDatos' },
]

// El panel de marca no se muestra abajo de lg: en una pantalla angosta, apilarlo
// arriba del formulario deja el campo de usuario debajo del pliegue.
function PanelMarca() {
  const t = useT()
  return (
    <section className="relative hidden overflow-hidden border-r border-tint/[0.07] bg-surface-card px-10 py-9 lg:flex lg:flex-col">
      {/* Los dos orbes del inicio, arriba y abajo. Son el único "fondo" del
          panel; el resto es la superficie.
          Antes eran dos resplandores rosas desenfocados con el degradé de marca,
          y encima parpadeaban — ver el comentario de `.orbe` en index.css. Ahora
          es el mismo círculo con anillo que reparte la landing entre sus
          secciones, así entrar por el sitio y entrar por acá no cambian de
          idioma. Entran mayormente fuera del panel: lo que se ve es el arco. */}
      <div className="orbe -left-48 -top-40 h-[34rem] w-[34rem]" style={{ '--d': '120ms' }} aria-hidden="true" />
      <div className="orbe -bottom-44 -right-40 h-[28rem] w-[28rem]" style={{ '--d': '220ms' }} aria-hidden="true" />

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        {/* Acá va la marca sola y no el logotipo entero: el nombre escrito le
            queda a un renglón del titular, y "conext / Todo WhatsApp" leído
            seguido son dos titulares peleándose el centro del panel. El nombre
            está igual en la pestaña y en el formulario de al lado.
            El retraso va en un envoltorio porque `LogoMarca` solo acepta
            `className`. */}
        <div className="animate-scale-in" style={{ '--d': '140ms' }}>
          <LogoMarca className="h-[88px] w-auto text-ink-primary" />
        </div>

        <h1
          className="animate-fade-up mt-12 max-w-[15ch] text-[34px] font-semibold leading-[1.15] tracking-tight text-ink-primary"
          style={{ '--d': '240ms' }}
        >
          {t('login.titular')}
          <br />
          <span className="text-violet">{t('login.titularAcento')}</span>
        </h1>
        <p
          className="animate-fade-up mt-4 max-w-[42ch] text-[13.5px] leading-relaxed text-ink-muted"
          style={{ '--d': '300ms' }}
        >
          {t('login.bajadaPanel')}
        </p>
      </div>

      <ul
        className="animate-fade-in relative flex items-center justify-center gap-6 text-[12px] text-ink-faint"
        style={{ '--d': '420ms' }}
      >
        {VENTAJAS.map(({ Icon, clave }) => (
          <li key={clave} className="flex items-center gap-1.5">
            <Icon size={13} />
            {t(clave)}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Login({
  onLogin,
  onOAuth,
  oauthPending = false,
  entrando = false,
  correoInicial = '',
  social = false,
  error,
  onClearError,
  theme,
  onToggleTheme,
}) {
  const t = useT()
  const [tab, setTab] = useState('ingresar')
  // Con Auth de verdad la landing manda el correo en la URL: llega escrito.
  const [username, setUsername] = useState(correoInicial)
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
    <div className="min-h-[calc(100dvh-var(--barra-titulo))] bg-surface-page lg:grid lg:grid-cols-2">
      <PanelMarca />

      <section className="relative flex min-h-[calc(100dvh-var(--barra-titulo))] items-center justify-center px-5 py-12 lg:min-h-0">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t('comun.temaClaro') : t('comun.temaOscuro')}
            title={theme === 'dark' ? t('comun.temaClaro') : t('comun.temaOscuro')}
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
            aria-label={t('login.acceso')}
            className="animate-fade-up grid grid-cols-2 gap-1 rounded-xl border border-tint/[0.08] bg-tint/[0.03] p-1"
            style={{ '--d': '80ms' }}
          >
            {PESTANAS.map(({ key, clave }, i) => (
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
                {t(clave)}
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
              {tab === 'ingresar' ? t('login.holaDeNuevo') : t('login.pediTuAcceso')}
            </h2>
            <p className="mb-6 mt-1.5 text-center text-[13px] leading-relaxed text-ink-muted">
              {tab === 'ingresar' ? t('login.bajadaIngresar') : t('login.bajadaCrear')}
            </p>

            <SocialButtons
              onElegir={onOAuth}
              pending={oauthPending}
              separador={
                tab === 'ingresar' ? t('login.separadorCorreo') : t('login.separadorCuenta')
              }
            />

            {error && (
              <p className="animate-pop-in mb-4 text-center text-xs text-status-critical">{error}</p>
            )}

            {tab === 'ingresar' ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-tint/[0.07] bg-surface-card p-5 shadow-card"
              >
                <Input
                  id="username"
                  name="username"
                  label={social ? t('login.correo') : t('login.usuario')}
                  placeholder="admin"
                  value={username}
                  onChange={editar(setUsername)}
                  autoComplete="username"
                />
                <Input
                  id="password"
                  name="password"
                  label={t('login.contrasena')}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={editar(setPassword)}
                  autoComplete="current-password"
                />

                <Button type="submit" className="w-full" disabled={entrando}>
                  {t('login.iniciarSesion')}
                </Button>
              </form>
            ) : (
              <Button variant="secondary" className="w-full" onClick={() => cambiarTab('ingresar')}>
                {t('login.yaTengoCuenta')}
              </Button>
            )}

            {tab === 'ingresar' && !social && (
              <p className="mt-5 text-center text-xs text-ink-faint">
                {t('login.demoLocal')}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
