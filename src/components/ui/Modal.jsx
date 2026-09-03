import { useEffect } from 'react'
import { IconClose } from './icons'
import { useT } from '../../lib/i18n.jsx'

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }

export default function Modal({ title, description, onClose, children, width = 'md' }) {
  const t = useT()
  // Escape cierra, y mientras el modal está abierto la página de atrás no
  // scrollea. Las dos cosas son lo que separa un diálogo de un div flotante:
  // sin Escape, un modal abierto por accidente hay que cerrarlo apuntando a una
  // cruz de 15px; sin el bloqueo, la rueda del mouse mueve la página de abajo y
  // el modal se queda quieto arriba de un fondo que se corre.
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclado)
    }
  }, [onClose])

  return (
    // Sin `backdrop-blur`: desenfocar toda la pantalla *y* animarle la opacidad
    // obliga a recalcular el desenfoque del viewport entero en cada cuadro, y se
    // nota como un tirón cada vez que se abre un modal. El velo hace el mismo
    // trabajo de separar el fondo, y su densidad la pone el tema (`--scrim`).
    //
    // El click en el velo también cierra; el del panel no se propaga hasta acá.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
    >
      {/* El modal sí flota, así que acá la sombra grande está justificada
          (`shadow-pop`); las tarjetas de la página no la usan. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-pop-in flex max-h-[88vh] w-full flex-col rounded-xl border border-tint/10 bg-surface-raised shadow-pop ${WIDTHS[width]}`}
      >
        {/* El título va a 15px y no a 13: es el título de la pantalla que está
            tapando todo lo demás, y al mismo tamaño que el rótulo de un campo
            del formulario de abajo no se leía como su encabezado. */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-primary">{title}</h3>
            {description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('ui.cerrar')}
            className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-tint/[0.06] hover:text-ink-primary"
          >
            <IconClose size={15} />
          </button>
        </div>
        <div className="animate-fade-up min-h-0 flex-1 overflow-y-auto px-5 pb-5" style={{ '--d': '80ms' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
