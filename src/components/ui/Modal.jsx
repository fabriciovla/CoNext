import { IconClose } from './icons'

const WIDTHS = { md: 'max-w-md', lg: 'max-w-xl' }

export default function Modal({ title, onClose, children, width = 'md' }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        className={`animate-pop-in flex max-h-[88vh] w-full flex-col rounded-2xl border border-white/10 bg-surface-raised shadow-card ${WIDTHS[width]}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-ink-muted transition-all duration-200 hover:rotate-90 hover:bg-white/10 hover:text-ink-primary"
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
