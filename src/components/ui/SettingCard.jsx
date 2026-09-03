// La tarjeta de un ajuste. Es la unidad de Configuración: un solo dato por
// tarjeta, con la misma forma siempre —qué es y qué cambia arriba, el control
// en el medio, y una franja abajo con la regla del campo a la izquierda y la
// acción contra el borde derecho—.
//
// La franja es lo que hace que la página se pueda leer de un scroll: el botón
// de cada tarjeta cae siempre en el mismo eje, así que se ve de un vistazo qué
// quedó sin guardar. Sin franja, el botón flota al final de un cuerpo de alto
// variable y hay que buscarlo tarjeta por tarjeta.
//
// `hint` es la regla o la consecuencia del campo ("máximo 40 caracteres", "se
// aplica al instante"), no una segunda bajada: la explicación va arriba.
// Sin `hint` ni `action` no se dibuja la franja — una franja vacía es una raya.
export default function SettingCard({
  title,
  description,
  children,
  hint,
  action,
  className = '',
  bodyClassName = 'px-5 py-4',
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-xl border border-tint/[0.08] bg-surface-card shadow-card ${className}`}
    >
      <div className={bodyClassName}>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-primary">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
        {children && <div className="mt-3.5 min-w-0">{children}</div>}
      </div>

      {(hint || action) && (
        // El alto mínimo es para que la franja mida lo mismo tenga una línea de
        // regla o ninguna: con seis tarjetas apiladas, un pie que cambia de
        // alto según el texto se lee como seis tarjetas distintas.
        <div className="flex min-h-[3.25rem] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-tint/[0.06] bg-tint/[0.02] px-5 py-2.5">
          <div className="min-w-0 text-[12px] leading-relaxed text-ink-muted">{hint}</div>
          {action && <div className="ml-auto flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
    </section>
  )
}
