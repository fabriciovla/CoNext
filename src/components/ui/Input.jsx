// El rótulo de un campo, en un solo lugar. Estaba escrito a mano en seis
// pantallas y ya convivían dos versiones distintas dentro del mismo formulario
// (12.5px en gris acá, 13px medium en negro en Agentes), que es exactamente lo
// que hace que un formulario se vea armado de a pedazos.
//
// Va en minúscula y del tamaño del texto chico: en versalitas espaciadas
// competía con el propio dato que el campo contiene. El peso medio es lo único
// que lo separa del texto de ayuda que a veces va abajo.
export const LABEL_CLASS = 'mb-1.5 block text-[12.5px] font-medium text-ink-secondary'

export default function Input({ label, id, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label && <span className={LABEL_CLASS}>{label}</span>}
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
