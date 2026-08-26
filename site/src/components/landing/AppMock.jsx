import Logo from '../Logo'
import {
  IconArrowIn,
  IconArrowOut,
  IconBolt,
  IconBox,
  IconChart,
  IconClock,
  IconCompose,
  IconContactCard,
  IconHome,
  IconInbox,
  IconMic,
  IconNote,
  IconPaperclip,
  IconPhone,
  IconPlus,
  IconSearch,
  IconSend,
  IconSettings,
  IconSmile,
  IconSparkles,
  IconUser,
  IconUsers,
} from '../icons'

// La bandeja, dibujada con divs en vez de fotografiada.
//
// La captura de `public/` servía de referencia del layout real (cuatro
// columnas, carpetas, composer en isla, ficha del contacto) pero en el hero se
// veía opaca: recorte, compresión y el fondo de la página comiéndose los
// bordes. Acá se redibuja nítida, con la paleta de la landing, y se deja a la
// vista lo que esa foto no mostraba — el borrador de un agente esperando
// aprobación, que es lo que diferencia al producto.

const NAV = [
  { Icono: IconHome, label: 'Inicio' },
  { Icono: IconInbox, label: 'Bandeja', cuenta: '1', activo: true },
  { Icono: IconSparkles, label: 'Agentes IA' },
  { Icono: IconBox, label: 'Productos' },
  { Icono: IconSettings, label: 'Configuración' },
]

const CARPETAS = [
  { Icono: IconInbox, label: 'Todas', cuenta: '8', activa: true },
  { Icono: IconUser, label: 'Mías', cuenta: '3' },
  { Icono: IconUsers, label: 'Sin asignar', cuenta: '2' },
  { Icono: IconClock, label: 'Pendientes', cuenta: '1' },
]

const AGENTES = [
  { label: 'Recepcionista', cuenta: '4', on: true },
  { label: 'Ventas', cuenta: '3', on: true },
  { label: 'Envíos', cuenta: '1', on: false },
]

const CONVERSACIONES = [
  {
    nombre: 'Martín Ríos',
    ultimo: '¿Aceptan transferencia?',
    hora: '2 min',
    entrada: true,
    pendiente: 1,
    activa: true,
  },
  {
    nombre: 'Laura Gómez',
    ultimo: 'Perfecto, lo retiro mañana',
    hora: '18 min',
    entrada: false,
  },
  {
    nombre: 'Nicolás Paz',
    ultimo: '¿Hacen envíos a Córdoba?',
    hora: '1 h',
    entrada: true,
  },
  {
    nombre: 'Carla Vega',
    ultimo: 'Gracias! Cualquier cosa escribo',
    hora: '3 h',
    entrada: false,
  },
]

export function Foto({ size = 38 }) {
  return (
    <img
      src="/IconoSinFoto.webp"
      alt=""
      draggable={false}
      decoding="async"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}

export function AvatarCanal({ size = 38 }) {
  return (
    <div className="relative shrink-0">
      <Foto size={size} />
      <img
        src="/logowsp.webp"
        alt=""
        draggable={false}
        decoding="async"
        className="absolute -bottom-0.5 -right-0.5"
        style={{ width: 14, height: 14 }}
      />
    </div>
  )
}

function FilaNav({ icon, emoji, label, cuenta, activa, punto }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] ${
        activa ? 'bg-tint/[0.09] font-medium text-ink-primary' : 'text-ink-muted'
      }`}
    >
      {punto ? (
        <span className="flex w-4 justify-center">
          <span className={`h-1.5 w-1.5 rounded-full ${punto === 'on' ? 'bg-status-good' : 'bg-tint/30'}`} />
        </span>
      ) : emoji ? (
        <span className="w-4 text-center text-[13px] leading-none">{emoji}</span>
      ) : (
        <span className={activa ? 'text-ink-primary' : 'text-ink-muted'}>{icon}</span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {cuenta != null && (
        <span className={`text-[11px] tabular-nums ${activa ? 'text-ink-primary' : 'text-ink-faint'}`}>
          {cuenta}
        </span>
      )}
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div className="mt-3">
      <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{titulo}</p>
      <div className="space-y-px pt-0.5">{children}</div>
    </div>
  )
}

// La barra sale aparte porque la usa también la película de "El control": es la
// misma app, y dos copias de la barra empiezan iguales y terminan distintas.
export function BarraMock({ className = 'hidden w-[200px] md:flex' }) {
  return (
    <aside className={`shrink-0 flex-col border-r border-tint/[0.07] bg-surface-nav ${className}`}>
      <header className="flex items-center justify-center px-3 py-3.5">
        <Logo className="h-5 w-auto text-ink-primary" />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-2">
        {NAV.map(({ Icono, label, cuenta, activo }) => (
          <FilaNav key={label} icon={<Icono size={15} />} label={label} cuenta={cuenta} activa={activo} />
        ))}

        <Seccion titulo="Carpetas">
          {CARPETAS.map(({ Icono, label, cuenta, activa }) => (
            <FilaNav key={label} icon={<Icono size={15} />} label={label} cuenta={cuenta} activa={activa} />
          ))}
        </Seccion>

        <Seccion titulo="Agentes IA">
          {AGENTES.map(({ label, cuenta, on }) => (
            <FilaNav key={label} label={label} cuenta={cuenta} punto={on ? 'on' : 'off'} />
          ))}
          <FilaNav icon={<IconPlus size={15} />} label="Nuevo agente" />
        </Seccion>
      </div>

      <div className="shrink-0 border-t border-tint/[0.07] px-3 py-3">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]" />
          <p className="text-[12px] font-medium text-ink-primary">Día abierto</p>
          <span className="text-[10.5px] text-ink-faint">desde 9:12</span>
        </div>
        <div className="rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-center text-[12px] font-medium text-ink-secondary">
          Cerrar día
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-tint/[0.07] px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-tint/15 bg-tint/10 text-[11px] font-semibold text-ink-primary">
          A
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12px] font-medium text-ink-primary">Admin</p>
          <p className="truncate text-[10.5px] text-ink-faint">Administrador</p>
        </div>
      </div>
    </aside>
  )
}

export default function AppMock() {
  return (
    // El marco lo pone la card de afuera. Acá adentro la bandeja se dibuja un
    // poco más grande y se escala: así la ventana no cambia de tamaño y la
    // interfaz se lee como un escritorio, no como una UI inflada al ancho.
    <div
      aria-hidden="true"
      className="relative h-[500px] w-full transform-gpu overflow-hidden bg-surface-page text-left sm:h-[600px]"
    >
      <div className="absolute left-1/2 top-0 flex h-[114%] w-[114%] origin-top -translate-x-1/2 scale-[0.88]">
      {/* ------------------------------------------------------------------ */}
      {/* Barra                                                               */}
      {/* ------------------------------------------------------------------ */}
      <BarraMock />

      {/* ------------------------------------------------------------------ */}
      {/* Lista                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="hidden w-[252px] shrink-0 flex-col border-r border-tint/[0.07] bg-surface-card lg:flex">
        <header className="shrink-0 px-3 pt-2.5">
          <div className="flex items-center justify-between border-b border-tint/[0.07]">
            <div className="flex items-center gap-4">
              <span className="relative pb-2.5 pt-1 text-[13px] font-medium text-violet">
                Chats
                <span className="absolute -bottom-px left-0 h-[2px] w-full rounded-full bg-violet" />
              </span>
              <span className="pb-2.5 pt-1 text-[13px] font-medium text-ink-muted">Llamadas</span>
            </div>
            <div className="flex gap-0.5 pb-1.5 text-ink-muted">
              <span className="flex h-7 w-7 items-center justify-center">
                <IconCompose size={14} />
              </span>
              <span className="flex h-7 w-7 items-center justify-center">
                <IconSearch size={14} />
              </span>
            </div>
          </div>
          <p className="py-2 text-[12px] text-ink-muted">Abiertas, recientes</p>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden px-2 pb-2">
          {CONVERSACIONES.map(({ nombre, ultimo, hora, entrada, pendiente, etiqueta, activa }) => (
            <div
              key={nombre}
              className={`flex items-start gap-2.5 rounded-lg px-2 py-2 ${activa ? 'bg-violet-soft' : ''}`}
            >
              <AvatarCanal size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-ink-primary">{nombre}</p>
                  <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">{hora}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {entrada ? (
                    <IconArrowIn size={12} className="shrink-0 text-[#25d366]" />
                  ) : (
                    <IconArrowOut size={12} className="shrink-0 text-ink-faint" />
                  )}
                  <p className="min-w-0 flex-1 truncate text-[12px] text-ink-muted">{ultimo}</p>
                  {pendiente > 0 && (
                    <span className="flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-status-warning px-1 text-[10px] font-bold text-status-ink">
                      {pendiente}
                    </span>
                  )}
                </div>
                {etiqueta && (
                  <span className="mt-1 inline-block max-w-[110px] truncate rounded-full border border-violet/20 bg-violet-soft px-1.5 py-px text-[10.5px] text-violet">
                    {etiqueta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Conversación                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="flex min-w-0 flex-1 flex-col bg-surface-card">
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-5 py-4">
          <p className="mb-1 text-center text-[11.5px] text-ink-faint">Viernes, 14 de agosto</p>

          <Burbuja>
            Hola, ¿tienen la campera de jean en talle M?
          </Burbuja>
          <Burbuja propio bot>
            Sí, nos queda una en M. Sale $48.900 y si la pides hoy sale para tu casa mañana.
          </Burbuja>
          <Burbuja>Buenísimo. ¿Aceptan transferencia?</Burbuja>
        </div>

        <div className="mx-auto w-full max-w-[36rem] shrink-0 px-4 pb-4 pt-1">
          <div className="mb-2 overflow-hidden rounded-2xl border border-violet/25 bg-violet-soft">
            <div className="flex items-start gap-2.5 px-3.5 pt-3">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet/15 text-violet">
                <IconSparkles size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-medium text-violet">
                  Respuesta sugerida
                  <span className="text-ink-muted"> · la escribió Ventas</span>
                </p>
                <p className="mt-1 text-[13px] leading-snug text-ink-primary">
                  Sí, aceptamos transferencia. Te paso los datos de la cuenta y en cuanto me envíes el comprobante lo despacho.
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-violet/15 px-2.5 py-1.5">
              <span className="rounded-lg px-2.5 py-1 text-[11.5px] text-ink-muted">Descartar</span>
              <span className="rounded-lg bg-violet px-2.5 py-1 text-[11.5px] font-medium text-ink-inverted">
                Usar y editar
              </span>
            </div>
          </div>

          <div className="flex items-end gap-1 rounded-3xl border border-tint/[0.09] bg-surface-raised p-1.5 shadow-card">
            <span className="min-w-0 flex-1 px-2.5 py-2 text-[13.5px] text-ink-faint">Escribe un mensaje</span>
            <span className="flex shrink-0 items-center gap-0.5 pr-0.5 text-ink-muted">
              <span className="flex h-8 w-8 items-center justify-center">
                <IconSmile size={16} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center">
                <IconPaperclip size={16} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center">
                <IconMic size={16} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-primary text-ink-inverted">
                <IconSend size={14} />
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Ficha                                                               */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden shrink-0 border-l border-tint/[0.07] bg-surface-nav xl:flex">
        <div className="w-[248px] overflow-hidden p-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Foto size={56} />
            <div>
              <p className="text-[14.5px] font-semibold text-ink-primary">Martín Ríos</p>
              <p className="text-[12px] tabular-nums text-ink-muted">+54 9 11 5555-0142</p>
            </div>
            <div className="mt-1 flex gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[12px] text-ink-secondary">
                <IconPhone size={13} />
                Llamar
              </span>
              <span className="rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[12px] text-ink-secondary">
                Copiar
              </span>
            </div>
          </div>

          <div className="relative mt-4">
            <IconSearch
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <div className="truncate whitespace-nowrap rounded-lg border border-tint/10 bg-tint/[0.04] py-2 pl-8 pr-3 text-[12px] text-ink-faint">
              Buscar en la conversación
            </div>
          </div>

          <dl className="mt-4 space-y-3 border-t border-tint/[0.07] pt-3">
            {[
              ['Atendida por', 'Ventas'],
              ['Responsable', 'Admin'],
              ['Canal', 'WhatsApp'],
            ].map(([clave, valor]) => (
              <div key={clave}>
                <dt className="text-[12px] text-ink-faint">{clave}</dt>
                <dd className="mt-1 text-[13px] text-ink-primary">{valor}</dd>
              </div>
            ))}
            <div>
              <p className="text-[12px] text-ink-faint">Etiquetas</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-full border border-tint/10 bg-tint/[0.05] px-2.5 py-[3px] text-[11.5px] text-ink-secondary">
                  ventas
                </span>
                <span className="rounded-full border border-dashed border-tint/15 px-2.5 py-[3px] text-[11.5px] text-ink-muted">
                  + etiqueta
                </span>
              </div>
            </div>
          </dl>
        </div>

        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-l border-tint/[0.07] py-3 text-ink-muted">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint/[0.09] text-ink-primary">
            <IconContactCard size={15} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center">
            <IconChart size={15} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center">
            <IconNote size={15} />
          </span>
        </div>
      </aside>
      </div>
    </div>
  )
}

function Burbuja({ propio, bot, children }) {
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[78%] items-end gap-2 ${propio ? 'flex-row-reverse' : ''}`}>
        {propio ? (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
              bot ? 'border-violet/30 bg-violet-soft text-violet' : 'border-tint/15 bg-tint/10 text-ink-primary'
            }`}
          >
            {bot ? 'V' : 'A'}
          </span>
        ) : (
          <Foto size={28} />
        )}
        <div>
          <p
            className={`rounded-2xl border px-3.5 py-2 text-[13px] leading-relaxed text-ink-primary ${
              propio
                ? 'rounded-br-md border-violet/25 bg-violet-soft'
                : 'rounded-bl-md border-tint/[0.07] bg-tint/[0.055]'
            }`}
          >
            {children}
          </p>
          {bot && (
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-faint">
              <IconBolt size={11} />
              Ventas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
