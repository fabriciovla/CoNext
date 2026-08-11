// Interruptor de una línea: etiqueta a la izquierda, palanca a la derecha. Se
// usa para los dos estados de un agente (activo / envío automático), donde un
// checkbox común se leería como parte del formulario y no como un control que
// cambia el comportamiento del sistema.
export default function Switch({ checked, onChange, label, hint, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-left
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
        hover:border-white/[0.14] hover:bg-white/[0.05]
        disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/[0.07] disabled:hover:bg-white/[0.03]"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? 'bg-status-good' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}
