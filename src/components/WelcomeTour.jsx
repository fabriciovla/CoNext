import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { LogoMarca } from './ui/Logo'
import { IconChevronRight, IconSettings, IconUsers, IconInbox } from './ui/icons'
import { useT } from '../lib/i18n.jsx'
import pkg from '../../package.json'

// El modal que ve una sola vez quien entra por primera vez, después de la
// encuesta del alta. No es un tutorial: es la portada del tutorial. Dice qué es
// esto en dos renglones y ofrece los tres lugares que hay que tocar antes de
// que entre el primer mensaje, en el orden en que hay que tocarlos —sin
// canal conectado no llega nada, y sin agente lo que llega no se contesta—.
//
// El paso a paso arriba de la pantalla (el resaltado que va señalando la
// barra, la bandeja y el composer) es otra pieza y todavía no está; hasta que
// exista, "Hacer el tour" lleva al primer paso, que es lo que la persona iba a
// hacer igual.

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

export default function WelcomeTour({ nombre, onClose, onNavigate }) {
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
        <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-tint/[0.07] to-tint/[0.02]">
          <LogoMarca className="h-11 w-auto text-ink-primary" />
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
              className="group flex w-full items-center gap-3 rounded-lg border border-tint/[0.12] px-3 py-2.5 text-left transition-colors duration-150 hover:border-tint/25 hover:bg-tint/[0.03]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint/[0.06] text-ink-secondary">
                <Icono size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-ink-primary">
                    {t(titulo)}
                  </span>
                  {i === 0 && (
                    <span className="shrink-0 rounded-full bg-violet/10 px-2 py-0.5 text-[11px] font-medium text-violet">
                      {t('bienvenida.empezaAca')}
                    </span>
                  )}
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
          <Button onClick={() => ir(PASOS[0].pagina)}>{t('bienvenida.hacer')}</Button>
        </div>
      </div>
    </Modal>
  )
}
