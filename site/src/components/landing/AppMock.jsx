import Logo from '../Logo'
import {
  IconBolt,
  IconBox,
  IconChart,
  IconCheck,
  IconChevronDown,
  IconInbox,
  IconSearch,
  IconSettings,
  IconSparkles,
} from '../icons'

// La app, dibujada con divs en vez de fotografiada.
//
// Es una maqueta y no una captura de pantalla por tres razones: no se
// desactualiza cada vez que cambia un color de la dashboard, se ve nítida en
// cualquier pantalla sin mandar un PNG de dos megas, y no expone conversaciones
// de nadie. Lo que muestra sí es la app real: las mismas cuatro columnas
// (barra, lista, conversación, contacto) y el mismo comportamiento — abajo de
// todo, el borrador que un agente dejó esperando aprobación.
//
// Los datos son inventados y están puestos para que se entienda el producto de
// un vistazo. Ningún teléfono de acá existe.

const NAV = [
  { Icono: IconChart, label: 'Inicio' },
  { Icono: IconInbox, label: 'Bandeja', cuenta: '12', activo: true },
  { Icono: IconSparkles, label: 'Agentes IA' },
  { Icono: IconBox, label: 'Productos' },
  { Icono: IconSettings, label: 'Configuración' },
]

const CONVERSACIONES = [
  {
    nombre: 'Sofía Martínez',
    ultimo: '¿Les queda la campera de jean en talle M?',
    hora: '2 min',
    etiqueta: 'ventas',
    sinLeer: true,
    activa: true,
  },
  {
    nombre: 'Julián Rossi',
    ultimo: 'Listo, ya hice la transferencia 👍',
    hora: '14 min',
    etiqueta: 'pagos',
  },
  {
    nombre: 'Carla Gómez',
    ultimo: '¿Hacen envíos a Córdoba capital?',
    hora: '1 h',
    etiqueta: 'envíos',
  },
  {
    nombre: 'Martín Quiroga',
    ultimo: 'Gracias! Cualquier cosa te escribo',
    hora: '3 h',
  },
]

function Avatar({ nombre, size = 26 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-[10px] font-semibold text-white/80"
    >
      {nombre.charAt(0)}
    </span>
  )
}

export default function AppMock() {
  return (
    // aria-hidden porque es decoración: cada dato de acá adentro es inventado y
    // leerlo en voz alta de corrido no le aporta nada a quien no ve la imagen.
    // Lo que la página tiene para decir está en el texto de al lado.
    <div
      aria-hidden="true"
      className="flex h-[480px] w-full overflow-hidden rounded-t-2xl border border-white/10 bg-surface-page text-left sm:h-[560px]"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Barra lateral                                                     */}
      {/* ---------------------------------------------------------------- */}
      <aside className="hidden w-[188px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0a0a] md:flex">
        <header className="flex items-center gap-2 px-3 py-3.5">
          <Logo className="h-4 w-auto text-white" />
        </header>

        <div className="flex-1 px-2">
          {NAV.map(({ Icono, label, cuenta, activo }) => (
            <div
              key={label}
              className={`relative mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[11.5px] ${
                activo ? 'bg-white/[0.09] font-medium text-white' : 'text-white/55'
              }`}
            >
              {activo && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-violet" />
              )}
              <Icono size={14} className={activo ? 'text-white' : 'text-white/40'} />
              <span className="flex-1 truncate">{label}</span>
              {cuenta && <span className="text-[10px] tabular-nums text-white/40">{cuenta}</span>}
            </div>
          ))}

          <p className="mt-5 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-white/30">
            Agentes
          </p>
          {[
            { emoji: '🛍️', label: 'Ventas', cuenta: '8' },
            { emoji: '🚚', label: 'Envíos', cuenta: '3' },
            { emoji: '💳', label: 'Pagos', cuenta: '1' },
          ].map(({ emoji, label, cuenta }) => (
            <div
              key={label}
              className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[11.5px] text-white/55"
            >
              <span className="w-[14px] text-center text-[11px] leading-none">{emoji}</span>
              <span className="flex-1 truncate">{label}</span>
              <span className="text-[10px] tabular-nums text-white/40">{cuenta}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.07] px-3 py-2.5">
          <Avatar nombre="F" size={22} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[10.5px] font-medium text-white/85">Tienda Aurora</p>
            <p className="truncate text-[9px] text-white/35">Administrador</p>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Lista de conversaciones                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="hidden w-[262px] shrink-0 flex-col border-r border-white/[0.07] bg-surface-card lg:flex">
        <header className="border-b border-white/[0.07] px-3.5 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5">
            <IconSearch size={13} className="text-white/35" />
            <span className="text-[11px] text-white/35">Buscar conversación</span>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px]">
            <span className="border-b-2 border-violet pb-1.5 font-medium text-white">Todas 24</span>
            <span className="pb-1.5 text-white/45">Sin responder 3</span>
          </div>
        </header>

        <div className="flex-1">
          {CONVERSACIONES.map(({ nombre, ultimo, hora, etiqueta, sinLeer, activa }) => (
            <div
              key={nombre}
              className={`flex gap-2.5 border-b border-white/[0.04] px-3.5 py-3 ${activa ? 'bg-white/[0.05]' : ''}`}
            >
              <Avatar nombre={nombre} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate text-[11.5px] ${sinLeer ? 'font-semibold text-white' : 'text-white/75'}`}>
                    {nombre}
                  </p>
                  <span className="shrink-0 text-[9.5px] text-white/35">{hora}</span>
                </div>
                <p className={`mt-0.5 truncate text-[10.5px] ${sinLeer ? 'text-white/70' : 'text-white/40'}`}>
                  {ultimo}
                </p>
                {etiqueta && (
                  <span className="mt-1.5 inline-block rounded-full bg-violet-soft px-1.5 py-0.5 text-[9px] text-violet">
                    {etiqueta}
                  </span>
                )}
              </div>
              {sinLeer && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Conversación                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="flex min-w-0 flex-1 flex-col bg-surface-page">
        <header className="flex items-center gap-2.5 border-b border-white/[0.07] px-4 py-2.5">
          <Avatar nombre="Sofía" size={28} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12px] font-medium text-white">Sofía Martínez</p>
            <p className="truncate text-[10px] text-white/40">+54 9 11 5555-0142</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-violet-soft px-2.5 py-1 text-[10px] font-medium text-violet sm:flex">
            <IconBolt size={11} />
            Ventas
          </span>
          <span className="hidden items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[10.5px] text-white/70 sm:flex">
            Resolver
            <IconChevronDown size={11} />
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-end gap-2.5 px-4 py-4">
          <Burbuja>¡Hola! ¿Les queda la campera de jean en talle M?</Burbuja>
          <Burbuja propio>
            ¡Hola Sofía! Sí, nos queda una en M. Sale $48.900 y si la pedís hoy sale para tu casa mañana 🙌
          </Burbuja>
          <Burbuja>Buenísimo. ¿Aceptan transferencia?</Burbuja>
        </div>

        {/* El borrador esperando aprobación. Es lo que diferencia al producto de
            un bot suelto, así que es lo que la maqueta muestra abajo de todo,
            que es donde termina de leerse la imagen. */}
        <footer className="border-t border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2">
            <IconBolt size={12} className="shrink-0 text-violet" />
            <p className="text-[10px] font-medium uppercase tracking-wide text-violet">
              Borrador de Ventas
            </p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-white/75">
            Sí, aceptamos transferencia. Te paso el CBU y en cuanto me mandes el comprobante lo despacho.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-accent-gradient px-2.5 py-1.5 text-[10.5px] font-medium text-white">
              <IconCheck size={11} />
              Aprobar y enviar
            </span>
            <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10.5px] text-white/70">
              Editar
            </span>
          </div>
        </footer>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Ficha del contacto                                                */}
      {/* ---------------------------------------------------------------- */}
      <aside className="hidden w-[212px] shrink-0 flex-col border-l border-white/[0.07] bg-surface-card px-4 py-4 xl:flex">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Contacto</p>
        <div className="mt-4 flex flex-col items-center text-center">
          <Avatar nombre="Sofía" size={48} />
          <p className="mt-2.5 text-[12.5px] font-medium text-white">Sofía Martínez</p>
          <p className="mt-0.5 text-[10px] text-white/40">Cliente desde marzo 2025</p>
        </div>

        <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4">
          {[
            ['Teléfono', '+54 9 11 5555-0142'],
            ['Compras', '4 pedidos'],
            ['Última compra', '$32.400'],
          ].map(([clave, valor]) => (
            <div key={clave}>
              <dt className="text-[9.5px] uppercase tracking-wide text-white/35">{clave}</dt>
              <dd className="mt-0.5 text-[11px] text-white/75">{valor}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <p className="text-[9.5px] uppercase tracking-wide text-white/35">Etiquetas</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['ventas', 'mayorista'].map((e) => (
              <span key={e} className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[9.5px] text-white/65">
                {e}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function Burbuja({ propio, children }) {
  return (
    <div className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed ${
          propio
            ? 'rounded-br-md bg-accent-gradient text-white'
            : 'rounded-bl-md bg-white/[0.07] text-white/85'
        }`}
      >
        {children}
      </p>
    </div>
  )
}
