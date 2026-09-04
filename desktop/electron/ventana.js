import fs from 'node:fs'
import path from 'node:path'
import { app, screen } from 'electron'

// Dónde quedó la ventana la última vez. Va en userData y no al lado del
// ejecutable: en una instalación por máquina, Archivos de programa es de solo
// lectura y guardarlo ahí falla en silencio.
const ARCHIVO = () => path.join(app.getPath('userData'), 'ventana.json')

export const POR_DEFECTO = { width: 1360, height: 880 }
export const MINIMO = { width: 1024, height: 680 }

// Una posición guardada puede quedar fuera de toda pantalla: se desenchufó el
// monitor donde estaba, o cambió la resolución. Restaurarla así deja la ventana
// invisible y la app parece no abrir.
function visible(bounds) {
  return screen.getAllDisplays().some(({ workArea: a }) => {
    return (
      bounds.x < a.x + a.width &&
      bounds.x + bounds.width > a.x &&
      bounds.y < a.y + a.height &&
      bounds.y + bounds.height > a.y
    )
  })
}

export function leerEstado() {
  try {
    const guardado = JSON.parse(fs.readFileSync(ARCHIVO(), 'utf-8'))
    const { width, height, x, y, maximizada } = guardado
    const bounds = {
      width: Math.max(MINIMO.width, Number(width) || POR_DEFECTO.width),
      height: Math.max(MINIMO.height, Number(height) || POR_DEFECTO.height),
    }
    if (Number.isFinite(x) && Number.isFinite(y) && visible({ ...bounds, x, y })) {
      bounds.x = x
      bounds.y = y
    }
    return { ...bounds, maximizada: Boolean(maximizada) }
  } catch {
    return { ...POR_DEFECTO, maximizada: false }
  }
}

// Se guarda el tamaño *normal* (`getNormalBounds`), no el de pantalla: con la
// ventana maximizada, `getBounds` devuelve el monitor entero y al restaurarla
// desde maximizada la próxima vez ocuparía todo sin estarlo.
export function guardarEstado(ventana) {
  if (!ventana || ventana.isDestroyed()) return
  try {
    const { x, y, width, height } = ventana.getNormalBounds()
    fs.writeFileSync(
      ARCHIVO(),
      JSON.stringify({ x, y, width, height, maximizada: ventana.isMaximized() }),
    )
  } catch {
    /* que no se acuerde del tamaño no es motivo para romper el cierre */
  }
}
