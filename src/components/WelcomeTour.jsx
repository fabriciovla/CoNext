import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { LogoMarca } from './ui/Logo'
import { IconChevronRight, IconInbox, IconPointer, IconSettings, IconUsers } from './ui/icons'
import { useT } from '../lib/i18n.jsx'
import pkg from '../../package.json'

// El modal que ve una sola vez quien entra por primera vez, después de la
// encuesta del alta. No es un tutorial: es la portada del tutorial. Dice qué es
// esto en dos renglones y ofrece los tres lugares que hay que tocar antes de
// que entre el primer mensaje, en el orden en que hay que tocarlos —sin
// canal conectado no llega nada, y sin agente lo que llega no se contesta—.
//
// "Hacer el tour" abre el recorrido guiado (`Tour.jsx`), que es el paso a paso
// sobre la app de verdad: recorta la pieza de la que habla y, en varios pasos,
// le pasa el control al admin —tocá esta fila, escribí en este cuadro— en vez
// de ofrecerle otro "Siguiente". Que sea así es justamente lo que hay que decir
// acá antes de que alguien elija: ver `bienvenida.tourInteractivo`.
//
// Las tres filas siguen llevando directo a su pantalla: son para quien ya sabe
// qué es esto y viene a enchufar su WhatsApp, no a que le expliquen la app.

const CLAVE = 'wsp-crm:bienvenida'

// Leer y escribir el flag están acá y no en un hook porque son dos líneas y un
// try: en incógnito con el almacenamiento bloqueado, no poder recordar que ya
// se vio la bienvenida no es motivo para que no abra la app.
export function bienvenidaPendiente() {
  try {
    return localStorage.getItem(CLAVE) !== 'visto'
  } catch {
    return false
  }
}

function marcarVista() {
  try {
    localStorage.setItem(CLAVE, 'visto')
  } catch {
    /* ver bienvenidaPendiente */
  }
}

// Las claves van escritas enteras y no armadas con el nombre del paso: un
// `t('bienvenida.paso' + x + 'Titulo')` no lo encuentra ningún grep, que es como
// se llega a un texto huérfano en el diccionario y a otro faltando en pantalla.
const PASOS = [
  {
    clave: 'canales',
    Icono: IconSettings,
    pagina: 'settings',
    titulo: 'bienvenida.pasoCanalesTitulo',
    bajada: 'bienvenida.pasoCanalesBajada',
  },
  {
    clave: 'agentes',
    Icono: IconUsers,
    pagina: 'agents',
    titulo: 'bienvenida.pasoAgentesTitulo',
    bajada: 'bienvenida.pasoAgentesBajada',
  },
  {
    clave: 'bandeja',
    Icono: IconInbox,
    pagina: 'inbox',
    titulo: 'bienvenida.pasoBandejaTitulo',
    bajada: 'bienvenida.pasoBandejaBajada',
  },
]

export default function WelcomeTour({ nombre, onClose, onNavigate, onTour }) {
  // Arranca tildado. El interruptor está para que alguien que quiera volver a
  // ver esto lo destilde, y no para que la pantalla vuelva a aparecer en cada
  // recarga hasta que se acuerden de tildarlo: una bienvenida que insiste deja
  // de ser una bienvenida.
  const [noMostrar, setNoMostrar] = useState(true)
  const t = useT()

  const cerrar = () => {
    if (noMostrar) marcarVista()
    onClose()
  }

  const ir = (pagina) => {
    cerrar()
    onNavigate(pagina)
  }

  // El tour se hace cargo de la navegación desde el primer paso, así que acá no
  // se navega a ningún lado: solo se marca visto y se le da paso.
  const hacerTour = () => {
    if (noMostrar) marcarVista()
    onTour()
  }

  return (
    <Modal
      width="lg"
      title={t('bienvenida.titulo', { nombre })}
      description={t('bienvenida.bajada')}
      onClose={cerrar}
      banner={
        // Un degradé de tinta y no el de marca: el acento es el único color con
        // voz y acá no señala nada, es el fondo de un dibujo. La marca sola
        // —no el logotipo— porque el nombre escrito ya está en el título.
        //
        // Atrás va un halo del mismo gris, apoyado justo detrás de la marca:
        // el degradé de esquina a esquina dejaba la marca flotando sobre la
        // parte más clara de la franja, sin nada que la sostuviera.
        <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-tint/[0.08] via-tint/[0.03] to-transparent">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, rgb(var(--tint) / 0.10), rgb(var(--tint) / 0.03) 55%, transparent)',
            }}
          />
          <LogoMarca className="relative h-11 w-auto text-ink-primary" />
          <span className="absolute right-3 top-3 font-mono text-[11px] text-ink-faint">
            v{pkg.version}
          </span>
        </div>
      }
    >
      <ul className="mt-1 space-y-2">
        {PASOS.map(({ clave, Icono, pagina, titulo, bajada }, i) => (
          <li key={clave}>
            <button
              onClick={() => ir(pagina)}
              className="group flex w-full items-center gap-3 rounded-xl border border-tint/[0.12] px-3 py-2.5 text-left transition-colors duration-150 hover:border-tint/25 hover:bg-tint/[0.03]"
            >
              {/* El ordinal reemplazó al cartel de "Empezá acá" que llevaba la
                  primera fila. El orden es de las tres y no de una: sin canal
                  conectado no entra nada, sin agente lo que entra no se
                  contesta, y recién ahí la bandeja tiene algo que mostrar. Un
                  1, un 2 y un 3 dicen eso entero; el cartel decía un tercio y
                  encima solo mientras se lo estaba mirando. */}
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-tint/[0.06] text-ink-secondary transition-colors duration-150 group-hover:bg-violet-soft group-hover:text-violet">
                <Icono size={16} />
                <span className="absolute -left-1.5 -top-1.5 flex size-[17px] items-center justify-center rounded-full bg-surface-raised text-[10px] font-semibold tabular-nums text-ink-muted ring-1 ring-tint/[0.12]">
                  {i + 1}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink-primary">
                  {t(titulo)}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                  {t(bajada)}
                </span>
              </span>
              <IconChevronRight
                size={15}
                className="shrink-0 text-ink-faint transition-colors duration-150 group-hover:text-ink-secondary"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Lo que separa al recorrido de las tres filas de arriba no es que sea
          más largo: es que se hace sobre la app y que en varios pasos toca el
          admin. Eso hay que decirlo antes de que alguien elija entre un botón
          que dice "Hacer el tour" y tres atajos que llevan directo. */}
      <p className="mt-3 flex items-start gap-2 px-0.5 text-[12px] leading-relaxed text-ink-muted">
        <IconPointer size={13} className="mt-0.5 shrink-0 text-violet" />
        {t('bienvenida.tourInteractivo')}
      </p>

      {/* La misma franja que cierra cada tarjeta de Configuración: la opción a
          la izquierda, las acciones contra el borde derecho. */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-tint/[0.08] pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-muted">
          <input
            type="checkbox"
            checked={noMostrar}
            onChange={(e) => setNoMostrar(e.target.checked)}
            className="size-3.5 accent-violet"
          />
          {t('bienvenida.noMostrar')}
        </label>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={cerrar}>
            {t('bienvenida.saltar')}
          </Button>
          <Button onClick={hacerTour}>{t('bienvenida.hacer')}</Button>
        </div>
      </div>
    </Modal>
  )
}
