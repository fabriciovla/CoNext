import { useEffect, useMemo, useRef, useState } from 'react'
import { EMOJI_CATEGORIES, EMOJI_INDEX } from '../../data/emojis'
import { useT } from '../../lib/i18n.jsx'

const RECIENTES_KEY = 'conext.emojis.recientes'
const MAX_RECIENTES = 24

function leerRecientes() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECIENTES_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((e) => typeof e === 'string').slice(0, MAX_RECIENTES) : []
  } catch {
    return []
  }
}

// Panel de emojis del composer. Los dibuja la fuente del sistema del admin, así
// que se ven igual que en el teclado de su computadora; acá solo se elige cuáles
// se ofrecen, en qué orden y cómo se buscan.
// `hacia` es para dónde se abre. Arriba es el caso del composer, que vive
// pegado al borde de abajo de la pantalla; la ficha de un agente lo tiene arriba
// de todo y ahí abrir hacia arriba lo dejaría cortado contra el encabezado.
export default function EmojiPicker({ onPick, onClose, hacia = 'arriba', anclaje = 'right-0' }) {
  const t = useT()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState(EMOJI_CATEGORIES[0].key)
  // Los últimos usados encabezan el panel: atendiendo se repiten siempre los
  // mismos cuatro o cinco y bajarlos a buscar cada vez es el trabajo de más.
  const [recientes, setRecientes] = useState(leerRecientes)
  const listaRef = useRef(null)

  const query = busqueda.trim().toLowerCase()
  const resultados = useMemo(() => {
    if (!query) return null
    return EMOJI_INDEX.filter((e) => e.palabras.includes(query)).map((e) => e.emoji)
  }, [query])

  // Cambiar de categoría vuelve arriba: si no, la grilla nueva arranca a mitad
  // de camino por el scroll que había quedado de la anterior.
  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = 0
  }, [categoria, query])

  const elegir = (emoji) => {
    const proximos = [emoji, ...recientes.filter((e) => e !== emoji)].slice(0, MAX_RECIENTES)
    setRecientes(proximos)
    try {
      localStorage.setItem(RECIENTES_KEY, JSON.stringify(proximos))
    } catch {
      // Modo incógnito o storage lleno: los recientes son una comodidad, no
      // algo por lo que valga la pena romper el envío de un emoji.
    }
    onPick(emoji)
  }

  const activa = EMOJI_CATEGORIES.find((c) => c.key === categoria) ?? EMOJI_CATEGORIES[0]
  const visibles = resultados ?? activa.emojis.map(([emoji]) => emoji)

  return (
    // Se ancla por la derecha y abre hacia adentro: el botón vive en el extremo
    // derecho del composer, y anclado a la izquierda el panel se iría 19.5rem
    // más allá del borde del hilo.
    <div
      className={`animate-scale-in absolute z-30 w-[19.5rem] overflow-hidden rounded-xl border border-tint/10
        bg-surface-raised shadow-pop ${anclaje} ${hacia === 'abajo' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="p-2">
        <input
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t('ui.buscarEmoji')}
          aria-label={t('ui.buscarEmoji')}
          className="w-full rounded-lg border border-tint/10 bg-tint/[0.04] px-2.5 py-1.5 text-[12.5px] text-ink-primary placeholder:text-ink-faint focus:border-tint/25 focus:outline-none"
        />
      </div>

      {/* Las pestañas se esconden buscando: ahí el resultado sale de todas las
          categorías y marcar una sería mentir sobre lo que se está viendo. */}
      {!query && (
        <div className="flex items-center gap-0.5 border-b border-tint/[0.07] px-2 pb-1.5">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoria(cat.key)}
              title={t(cat.clave)}
              aria-label={t(cat.clave)}
              aria-pressed={cat.key === categoria}
              className={`flex h-7 flex-1 items-center justify-center rounded-md text-[15px] leading-none transition-colors duration-150 ${
                cat.key === categoria ? 'bg-violet-soft' : 'hover:bg-tint/[0.07]'
              }`}
            >
              <span className={cat.key === categoria ? '' : 'opacity-70'}>{cat.icon}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={listaRef} className="max-h-56 overflow-y-auto px-2 pb-2 pt-1.5">
        {!query && recientes.length > 0 && (
          <>
            <p className="px-0.5 pb-1 text-[11px] text-ink-muted">{t('ui.recientes')}</p>
            <Grilla emojis={recientes} onPick={elegir} />
            <p className="px-0.5 pb-1 pt-2 text-[11px] text-ink-muted">{t(activa.clave)}</p>
          </>
        )}

        {visibles.length > 0 ? (
          <Grilla emojis={visibles} onPick={elegir} />
        ) : (
          <p className="px-1 py-6 text-center text-[12px] text-ink-faint">
            Ningún emoji coincide con “{busqueda.trim()}”.
          </p>
        )}
      </div>
    </div>
  )
}

function Grilla({ emojis, onPick }) {
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {emojis.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          onClick={() => onPick(emoji)}
          className="flex h-8 w-full items-center justify-center rounded-md text-[18px] leading-none transition-colors duration-150 hover:bg-tint/[0.09]"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
