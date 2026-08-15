// La etiqueta va en minúscula y del tamaño del texto normal: en versalitas
// espaciadas competía con el propio dato que el campo contiene.
export default function Input({ label, id, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label && <span className="mb-1.5 block text-[12.5px] text-ink-secondary">{label}</span>}
      <input
        id={id}
        className={`w-full rounded-lg border border-tint/[0.12] bg-transparent px-3 py-2 text-[13px] text-ink-primary
          placeholder:text-ink-faint transition-colors duration-150
          focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30
          ${className}`}
        {...props}
      />
    </label>
  )
}
