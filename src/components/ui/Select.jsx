import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconCheck } from './icons'
import { useT } from '../../lib/i18n.jsx'

// Desplegable de la app.
//
// Reemplaza al `<select>` nativo, que no se puede diseñar: la lista de opciones
// la dibuja el sistema operativo, no el navegador, así que ninguna clase de
// Tailwind la toca. Terminaba siendo un recuadro blanco con la tipografía del
// sistema y el resaltado azul de Windows en el medio de la ficha de contacto.
//
// `options`: [{ value, label, hint? }]
//
// El elegido se marca en violeta, como la carpeta activa y la conversación
// abierta: es el mismo "esto es lo que estás mirando" de toda la app.
export default function Select({
  value,
  options,
  onChange,
  variant = 'field',
  // Sin placeholder propio se usa el genérico traducido.
  placeholder,
  ariaLabel,
  className = '',
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  // Índice resaltado por teclado. Al abrir arranca en el elegido, no en el
  // primero: bajar una vez desde donde estás es lo que se espera.
  const [cursor, setCursor] = useState(0)
  const [haciaArriba, setHaciaArriba] = useState(false)
  const triggerRef = useRef(null)

  const elegida = options.find((o) => o.value === value) ?? null

  // El panel de la ficha de contacto tiene scroll propio, así que un menú que
  // se abre para abajo cerca del final queda cortado. Se mide al abrir y, si no
  // entra, se despliega para arriba.
  const abrir = () => {
    const alto = Math.min(options.length, 7) * 34 + 12
    const rect = triggerRef.current?.getBoundingClientRect()
    setHaciaArriba(Boolean(rect && rect.bottom + alto > window.innerHeight - 8))
    setCursor(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  // Cerrar con Escape desde cualquier lado, no solo con el foco puesto en el
  // botón: si el menú quedó abierto, Escape lo cierra.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const elegir = (opcion) => {
    if (opcion.value !== value) onChange(opcion.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        abrir()
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const paso = e.key === 'ArrowDown' ? 1 : -1
      setCursor((i) => (i + paso + options.length) % options.length)
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setCursor(e.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opcion = options[cursor]
      if (opcion) elegir(opcion)
    }
  }

  // `field` es el desplegable con marco, para cuando ocupa el lugar de un campo
  // de formulario. `plain` es texto suelto con su flecha, para cuando comparte
  // fila con otros controles y un recuadro lo haría pesar de más.
  const triggerClass =
    variant === 'field'
      ? `flex w-full items-center gap-2 rounded-lg border border-tint/[0.07] bg-tint/[0.04] py-2 pl-2.5 pr-2 text-left text-[14px] text-ink-primary
         transition-colors duration-200 hover:bg-tint/[0.07] focus-visible:border-tint/30 focus-visible:outline-none`
      : `flex items-center gap-1 rounded-md px-1 py-1 text-[12px] font-medium text-ink-secondary
         transition-colors duration-200 hover:text-ink-primary focus-visible:outline-none`

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : abrir())}
        onKeyDown={onKeyDown}
        className={triggerClass}
      >
        <span className={`min-w-0 truncate ${variant === 'field' ? 'flex-1' : ''}`}>
          {elegida?.label ?? placeholder ?? t('ui.elegir')}
        </span>
        {elegida?.hint && (
          <span className="shrink-0 text-[12px] text-ink-faint">{elegida.hint}</span>
        )}
        <IconChevronDown
          size={variant === 'field' ? 13 : 12}
          className={`shrink-0 text-ink-faint transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          {/* Tapa el resto de la pantalla para cerrar con un click afuera. El
              botón queda debajo, así que volver a tocarlo también cierra. */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            aria-label={ariaLabel}
            className={`animate-scale-in absolute left-0 z-30 max-h-[17rem] min-w-full overflow-y-auto rounded-xl border border-tint/10 bg-surface-raised py-1 shadow-pop
              ${haciaArriba ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          >
            {options.map((o, i) => {
              const activa = o.value === value
              return (
                <li key={o.value} role="option" aria-selected={activa}>
                  <button
                    type="button"
                    onClick={() => elegir(o)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors duration-100
                      ${i === cursor ? 'bg-tint/[0.07]' : ''}
                      ${activa ? 'text-violet' : 'text-ink-secondary'}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="shrink-0 text-[11.5px] text-ink-faint">{o.hint}</span>}
                    {activa && <IconCheck size={13} className="shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
