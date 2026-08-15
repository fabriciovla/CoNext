import { IconClose } from './icons'

const WIDTHS = { md: 'max-w-md', lg: 'max-w-xl' }

export default function Modal({ title, onClose, children, width = 'md' }) {
  return (
    // Sin `backdrop-blur`: desenfocar toda la pantalla *y* animarle la opacidad
    // obliga a recalcular el desenfoque del viewport entero en cada cuadro, y se
    // nota como un tirón cada vez que se abre un modal. El velo hace el mismo
    // trabajo de separar el fondo, y su densidad la pone el tema (`--scrim`).
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4">
      {/* El modal sí flota, así que acá la sombra grande está justificada
          (`shadow-pop`); las tarjetas de la página no la usan. */}
      <div
        className={`animate-pop-in flex max-h-[88vh] w-full flex-col rounded-xl border border-tint/10 bg-surface-raised shadow-pop ${WIDTHS[width]}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-1 pt-4">
          <h3 className="text-[13px] font-semibold text-ink-primary">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
          >
            <IconClose size={15} />
          </button>
        </div>
        <div className="animate-fade-up min-h-0 flex-1 overflow-y-auto p-5" style={{ '--d': '80ms' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
