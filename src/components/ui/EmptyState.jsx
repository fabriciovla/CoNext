// Lo que se ve cuando una sección todavía no tiene nada. Estaba escrito de
// nuevo en cada página —un ícono suelto, dos párrafos y a veces un botón—, con
// un tamaño de letra distinto en cada una.
//
// Va centrado, que es la excepción a la regla de alinear a la izquierda: acá no
// hay contenido con el que alinearse, y una columna de texto pegada al borde
// izquierdo de una tarjeta vacía se lee como algo que se cargó a medias.
//
// El ícono va en una baldosa redondeada y no suelto: a 20px sobre un fondo
// vacío se pierde, y la baldosa le da el peso que necesita para ser lo primero
// que se mira.
export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`animate-fade-in flex flex-col items-center px-6 py-12 text-center ${className}`}>
      {icon && (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-tint/[0.08] bg-tint/[0.03] text-ink-muted">
          {icon}
        </span>
      )}
      <p className="text-[14px] font-medium text-ink-primary">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  )
}
