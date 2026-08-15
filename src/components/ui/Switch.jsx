// Interruptor de una línea: etiqueta a la izquierda, palanca a la derecha. Se
// usa para los dos estados de un agente (activo / envío automático), donde un
// checkbox común se leería como parte del formulario y no como un control que
// cambia el comportamiento del sistema.
//
// Encendido va en violeta y no en verde: el violeta es el color de "esto está
// activo" en toda la app (la carpeta elegida, la conversación abierta). Con un
// interruptor por agente, media docena de verdes se comían la página.
//
// `block` en false lo deja del ancho de su contenido y sin recuadro, para cuando
// comparte fila con otros controles: enmarcado ahí se leía como un botón más.
export default function Switch({
  checked,
  onChange,
  label,
  hint,
  title,
  disabled = false,
  block = true,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group flex items-center text-left transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-40
        ${
          block
            ? 'w-full justify-between gap-3 rounded-lg border border-tint/[0.1] px-3.5 py-2.5 hover:border-tint/20'
            : 'justify-start gap-2'
        }`}
    >
      {!block && <Toggle checked={checked} />}
      {/* Sin etiqueta no se renderiza nada: un span vacío igual se comía el
          `gap` y dejaba al interruptor descentrado en su fila. Suelto, la
          palanca se explica sola y el `title` dice qué prende. */}
      {(label || hint) && (
        <span className="min-w-0">
          <span
            className={`block text-[12.5px] transition-colors duration-150 ${
              block
                ? 'font-medium text-ink-primary'
                : `group-hover:text-ink-primary ${checked ? 'text-ink-secondary' : 'text-ink-muted'}`
            }`}
          >
            {label}
          </span>
          {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted">{hint}</span>}
        </span>
      )}
      {block && <Toggle checked={checked} />}
    </button>
  )
}

function Toggle({ checked }) {
  return (
    <span
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-violet' : 'bg-tint/20'
      }`}
    >
      {/* Se mueve con `transform` y no con `left`: mover `left` es una
          posición, y el navegador relayoutea la palanca en cada cuadro. */}
      <span
        className={`absolute left-[2px] top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? 'translate-x-[14px]' : 'translate-x-0'
        }`}
      />
    </span>
  )
}
