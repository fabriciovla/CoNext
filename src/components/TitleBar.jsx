import { useEffect, useMemo, useRef, useState } from 'react'
import {
  alAccionDeMenu,
  comandoDeVentana,
  esEscritorio,
  esMacOS,
  pintarBarraDeVentana,
} from '../lib/entorno'
import { useT } from '../lib/i18n.jsx'

// La barra de título de la app de escritorio. La ventana no tiene marco del
// sistema, así que esta franja *es* la barra de título: se la puede arrastrar,
// el doble click maximiza, y de acá cuelgan los menús. Los botones de
// minimizar, maximizar y cerrar no están dibujados acá — los pinta Windows
// encima, a la derecha, para que se comporten como los de cualquier otra
// ventana (el imán del borde para acomodarla, el menú del botón derecho).
//
// En el navegador no se dibuja nada: `--barra-titulo` vale 0px y esto devuelve
// null, así que la dashboard publicada queda exactamente igual que antes.
//
// Los paneles son HTML a propósito: el menú nativo de Windows no se puede
// redondear ni pintarle el hover. El menú de aplicación de Electron sigue
// montado, invisible, porque de ahí salen los atajos (Ctrl+C, Ctrl+R, Ctrl+N).

// Los mismos ids que la barra de la izquierda, y el rótulo del mismo
// diccionario: el menú "Ver" y la barra tienen que decir lo mismo.
const PAGINAS = ['home', 'inbox', 'agents', 'products', 'templates', 'settings']

// De la terna que guarda el tema (`--surface-nav: 255 255 255`) al hexa que
// pide Windows.
function aHexa(variable) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  const partes = valor.split(/\s+/).map(Number)
  if (partes.length !== 3 || partes.some((n) => !Number.isFinite(n))) return null
  return `#${partes.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`
}

function atajo(teclas) {
  if (esMacOS()) {
    return teclas.map((t) => (t === 'Ctrl' ? '⌘' : t === 'Shift' ? '⇧' : t === 'Alt' ? '⌥' : t)).join('')
  }
  return teclas.join('+')
}

function idsDe(items) {
  return items.filter((item) => item.type !== 'separator').map((item) => item.id)
}

// El panel copia la forma del menú de una app de escritorio y no la de un
// dropdown de la dashboard: las filas van **a sangre**, de borde a borde del
// panel, y los separadores también. Un ítem resaltado con su propia píldora
// adentro de un margen se lee como una tarjeta en una lista; acá lo que se
// recorre es una columna, y la banda entera es lo que marca dónde está el
// cursor. Por eso el panel no lleva padding horizontal y sí `overflow-hidden`,
// que es lo que recorta la banda contra las esquinas redondeadas.
function MenuPanel({ items, resaltado, onResaltar, onElegir }) {
  return (
    <div
      role="menu"
      // Sin arrastre: si no, un click adentro se lee como mover la ventana.
      style={{ WebkitAppRegion: 'no-drag' }}
      className="absolute left-0 top-full z-[1] mt-[2px] min-w-[15.5rem] overflow-hidden rounded-[10px] border border-tint/10 bg-surface-raised py-1.5 shadow-pop"
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={`sep-${i}`} role="separator" className="my-1.5 h-px bg-tint/[0.08]" />
        }
        const activo = resaltado === item.id
        return (
          <button
            key={item.id}
            type="button"
            // La página en la que se está es una opción elegida de un grupo, no
            // una acción: se anuncia como tal en vez de agregarle una tilde,
            // que obligaría a una canaleta a la izquierda de *todos* los ítems.
            role={item.marcado === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.marcado}
            aria-keyshortcuts={item.atajo}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => onResaltar(item.id)}
            onClick={() => onElegir(item)}
            // El anillo de foco de `index.css` dibujaría un contorno adentro de
            // una banda que ya dice lo mismo: acá el resaltado *es* el foco.
            className={`flex h-[30px] w-full items-center justify-between gap-12 px-3.5 text-left text-[13px] leading-none outline-none focus-visible:outline-none
              ${activo ? 'bg-tint/[0.07]' : ''} ${item.marcado ? 'text-violet' : 'text-ink-primary'}`}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            {item.atajo && (
              <span className="shrink-0 tabular-nums text-[12px] text-ink-faint">{item.atajo}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function TitleBar({
  theme,
  autenticado = false,
  pagina,
  dayStatus,
  onNuevoAgente,
  onCerrarDia,
  onAbrirDia,
  onNavegar,
  onCerrarSesion,
  onToggleTheme,
}) {
  const t = useT()
  const escritorio = esEscritorio()
  const mac = esMacOS()
  const barraRef = useRef(null)
  const [abierto, setAbierto] = useState(null)
  const [resaltado, setResaltado] = useState(null)

  const paneles = useMemo(() => {
    const archivo = [
      autenticado && {
        id: 'nuevo-agente',
        label: t('nav.nuevoAgente'),
        atajo: atajo(['Ctrl', 'N']),
        run: () => onNuevoAgente?.(),
      },
      autenticado && { type: 'separator' },
      autenticado &&
        (dayStatus === 'open'
          ? { id: 'cerrar-dia', label: t('dia.cerrarDia'), run: () => onCerrarDia?.() }
          : { id: 'abrir-dia', label: t('dia.abrirNuevo'), run: () => onAbrirDia?.() }),
      autenticado && { type: 'separator' },
      autenticado && {
        id: 'cerrar-sesion',
        label: t('comun.cerrarSesion'),
        run: () => onCerrarSesion?.(),
      },
      autenticado && { type: 'separator' },
      mac
        ? { id: 'close', label: t('barra.cerrarVentana'), run: () => void comandoDeVentana('close') }
        : { id: 'quit', label: t('barra.salir'), run: () => void comandoDeVentana('quit') },
    ].filter(Boolean)

    const edicion = [
      { id: 'undo', label: t('barra.deshacer'), atajo: atajo(['Ctrl', 'Z']), run: () => void comandoDeVentana('undo') },
      {
        id: 'redo',
        label: t('barra.rehacer'),
        atajo: mac ? atajo(['Ctrl', 'Shift', 'Z']) : atajo(['Ctrl', 'Y']),
        run: () => void comandoDeVentana('redo'),
      },
      { type: 'separator' },
      { id: 'cut', label: t('barra.cortar'), atajo: atajo(['Ctrl', 'X']), run: () => void comandoDeVentana('cut') },
      { id: 'copy', label: t('barra.copiar'), atajo: atajo(['Ctrl', 'C']), run: () => void comandoDeVentana('copy') },
      { id: 'paste', label: t('barra.pegar'), atajo: atajo(['Ctrl', 'V']), run: () => void comandoDeVentana('paste') },
      {
        id: 'selectAll',
        label: t('barra.seleccionarTodo'),
        atajo: atajo(['Ctrl', 'A']),
        run: () => void comandoDeVentana('selectAll'),
      },
    ]

    const ver = [
      ...(autenticado
        ? [
            ...PAGINAS.map((id) => ({
              id: `ir-${id}`,
              label: t(`nav.${id}`),
              marcado: pagina === id,
              run: () => onNavegar?.(id),
            })),
            { type: 'separator' },
          ]
        : []),
      { id: 'reload', label: t('barra.recargar'), atajo: atajo(['Ctrl', 'R']), run: () => void comandoDeVentana('reload') },
      {
        id: 'forceReload',
        label: t('barra.recargarSinCache'),
        atajo: atajo(['Ctrl', 'Shift', 'R']),
        run: () => void comandoDeVentana('forceReload'),
      },
      { type: 'separator' },
      {
        id: 'resetZoom',
        label: t('barra.tamanoNormal'),
        atajo: atajo(['Ctrl', '0']),
        run: () => void comandoDeVentana('resetZoom'),
      },
      { id: 'zoomIn', label: t('barra.acercar'), atajo: atajo(['Ctrl', '=']), run: () => void comandoDeVentana('zoomIn') },
      { id: 'zoomOut', label: t('barra.alejar'), atajo: atajo(['Ctrl', '-']), run: () => void comandoDeVentana('zoomOut') },
      { type: 'separator' },
      {
        id: 'tema',
        label: theme === 'dark' ? t('barra.temaClaro') : t('barra.temaOscuro'),
        run: () => onToggleTheme?.(),
      },
      { type: 'separator' },
      {
        id: 'togglefullscreen',
        label: t('barra.pantallaCompleta'),
        atajo: mac ? '⌃⌘F' : 'F11',
        run: () => void comandoDeVentana('togglefullscreen'),
      },
      {
        id: 'toggleDevTools',
        label: t('barra.herramientas'),
        atajo: mac ? atajo(['Alt', 'Ctrl', 'I']) : atajo(['Ctrl', 'Shift', 'I']),
        run: () => void comandoDeVentana('toggleDevTools'),
      },
    ]

    const ventana = mac
      ? [
          { id: 'minimize', label: t('barra.minimizar'), run: () => void comandoDeVentana('minimize') },
          { id: 'zoom', label: t('barra.zoom'), run: () => void comandoDeVentana('zoom') },
          { id: 'front', label: t('barra.traerAlFrente'), run: () => void comandoDeVentana('front') },
        ]
      : null

    const ayuda = [
      { id: 'ayuda', label: t('barra.ayudaDeConext'), run: () => void comandoDeVentana('ayuda') },
    ]

    return [
      { id: 'archivo', label: t('barra.archivo'), items: archivo },
      { id: 'edicion', label: t('barra.edicion'), items: edicion },
      { id: 'ver', label: t('barra.ver'), items: ver },
      ...(ventana ? [{ id: 'ventana', label: t('barra.ventana'), items: ventana }] : []),
      { id: 'ayuda', label: t('barra.ayuda'), items: ayuda },
    ]
  }, [
    autenticado,
    dayStatus,
    mac,
    onAbrirDia,
    onCerrarDia,
    onCerrarSesion,
    onNavegar,
    onNuevoAgente,
    onToggleTheme,
    pagina,
    t,
    theme,
  ])

  useEffect(() => {
    if (!escritorio) return undefined
    // Un cuadro de espera a propósito. El atributo `data-theme` lo pone el
    // efecto de `useTheme`, que vive en App: los efectos del hijo corren antes
    // que los del padre, así que leer las variables acá mismo devolvería los
    // colores del tema anterior y la esquina de la ventana quedaría del color
    // de antes hasta el siguiente cambio.
    const cuadro = requestAnimationFrame(() => {
      const fondo = aHexa('--surface-nav')
      const simbolos = aHexa('--ink-secondary')
      if (fondo && simbolos) void pintarBarraDeVentana(fondo, simbolos)
    })
    return () => cancelAnimationFrame(cuadro)
  }, [escritorio, theme])

  // Atajos que no cubre un role de Electron (nuevo agente, cerrar el día, salir
  // de la sesión): el proceso principal los dispara y acá se ejecutan.
  useEffect(() => {
    if (!escritorio) return undefined
    return alAccionDeMenu((accion) => {
      if (accion === 'nuevo-agente') onNuevoAgente?.()
      else if (accion === 'cerrar-dia') onCerrarDia?.()
      else if (accion === 'abrir-dia') onAbrirDia?.()
      else if (accion === 'cerrar-sesion') onCerrarSesion?.()
    })
  }, [escritorio, onAbrirDia, onCerrarDia, onCerrarSesion, onNuevoAgente])

  useEffect(() => {
    if (!abierto) return undefined

    const onDown = (e) => {
      if (!barraRef.current?.contains(e.target)) {
        setAbierto(null)
        setResaltado(null)
      }
    }

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setAbierto(null)
        setResaltado(null)
        return
      }

      const items = paneles.find((p) => p.id === abierto)?.items ?? []
      const ids = idsDe(items)

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (ids.length === 0) return
        const paso = e.key === 'ArrowDown' ? 1 : -1
        setResaltado((prev) => {
          const i = ids.indexOf(prev)
          if (i < 0) return paso > 0 ? ids[0] : ids[ids.length - 1]
          return ids[(i + paso + ids.length) % ids.length]
        })
        return
      }

      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        if (ids.length === 0) return
        setResaltado(e.key === 'Home' ? ids[0] : ids[ids.length - 1])
        return
      }

      if (e.key === 'Enter' || e.key === ' ') {
        const item = items.find((i) => i.id === resaltado)
        if (!item || item.type === 'separator') return
        e.preventDefault()
        setAbierto(null)
        setResaltado(null)
        item.run?.()
        return
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const i = paneles.findIndex((p) => p.id === abierto)
        const paso = e.key === 'ArrowRight' ? 1 : -1
        const siguiente = paneles[(i + paso + paneles.length) % paneles.length]
        setAbierto(siguiente.id)
        setResaltado(null)
      }
    }

    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto, paneles, resaltado])

  if (!escritorio) return null

  const elegir = (item) => {
    setAbierto(null)
    setResaltado(null)
    item.run?.()
  }

  return (
    <div
      ref={barraRef}
      role="menubar"
      className="relative z-[60] flex h-8 shrink-0 items-center gap-0.5 border-b border-tint/[0.06] bg-surface-nav px-1.5"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* En macOS las tres luces van arriba a la izquierda y las dibuja el
          sistema: lo único que hay que hacer es no ponerles nada abajo. */}
      {mac && <span className="w-[62px]" aria-hidden="true" />}

      {paneles.map((panel) => {
        const esta = abierto === panel.id
        return (
          <div key={panel.id} className="relative">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={esta}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => {
                if (abierto && abierto !== panel.id) {
                  setAbierto(panel.id)
                  setResaltado(null)
                }
              }}
              onClick={() => {
                setAbierto((prev) => (prev === panel.id ? null : panel.id))
                setResaltado(null)
              }}
              style={{ WebkitAppRegion: 'no-drag' }}
              className={`h-6 rounded-md px-2.5 text-[12.5px] leading-none outline-none
                ${esta ? 'bg-tint/[0.07] text-ink-primary' : 'text-ink-secondary hover:bg-tint/[0.06] hover:text-ink-primary'}`}
            >
              {panel.label}
            </button>
            {esta && (
              <MenuPanel
                items={panel.items}
                resaltado={resaltado}
                onResaltar={setResaltado}
                onElegir={elegir}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
