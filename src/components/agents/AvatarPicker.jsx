import { useState } from 'react'
import AgentAvatar, { AVATARES } from '../ui/AgentAvatar'
import { useT } from '../../lib/i18n.jsx'

// El selector de la cara de un agente. Reemplaza al panel de emojis del sistema
// que había acá (ver `AgentAvatar`): son veinte caras nuestras y no mil
// quinientas del teclado, así que no hay buscador ni categorías —entran todas de
// una— y elegir es mirar la grilla, no tipear "auricular".
//
// **El nombre del rol va abajo y no debajo de cada cara.** Veinte rótulos de
// 40px son veinte líneas de texto de 8px que nadie lee y que triplican el alto
// del panel; una sola línea, la de la cara que se está mirando, dice lo mismo
// cuando hace falta. Tiene alto fijo: sin eso el panel crece y se encoge al
// pasar el mouse por la grilla.
export default function AvatarPicker({ valor, onPick, onClose, anclaje = 'left-0' }) {
  const t = useT()
  const [mirando, setMirando] = useState(null)
  // Un agente de antes de esto tiene guardado un emoji de texto: no es ninguna
  // de las veinte, así que no hay cuál marcar ni cuál nombrar.
  const elegida = AVATARES.some((a) => a.key === valor) ? valor : null
  const nombre = mirando ?? elegida

  return (
    <div
      className={`animate-scale-in absolute top-full z-30 mt-2 w-[17.5rem] overflow-hidden rounded-xl
        border border-tint/10 bg-surface-raised shadow-pop ${anclaje}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="grid grid-cols-5 gap-0.5 p-2" onMouseLeave={() => setMirando(null)}>
        {AVATARES.map((cara) => (
          <button
            key={cara.key}
            type="button"
            onClick={() => onPick(cara.key)}
            onMouseEnter={() => setMirando(cara.key)}
            onFocus={() => setMirando(cara.key)}
            aria-label={t(`agentes.avatares.${cara.key}`)}
            aria-pressed={cara.key === valor}
            className={`flex h-11 items-center justify-center rounded-lg transition-colors duration-150 ${
              cara.key === valor ? 'bg-violet-soft' : 'hover:bg-tint/[0.07]'
            }`}
          >
            <AgentAvatar avatar={cara.key} size={30} />
          </button>
        ))}
      </div>

      <p className="truncate border-t border-tint/[0.07] px-3 py-2 text-[11.5px] text-ink-muted">
        {nombre ? t(`agentes.avatares.${nombre}`) : t('agentes.elegirCara')}
      </p>
    </div>
  )
}
