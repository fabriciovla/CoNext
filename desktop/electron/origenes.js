import fs from 'node:fs'
import path from 'node:path'

// Los dominios con los que habla la página, escritos por el build
// (vite.desktop.config.js) con los mismos valores que quedaron adentro del
// bundle. Los lee el CSP y también el permiso para abrir el navegador: los dos
// tienen que estar de acuerdo con lo que el frontend realmente va a pedir.
export function leerOrigenes(raiz) {
  try {
    return JSON.parse(fs.readFileSync(path.join(raiz, 'origenes.json'), 'utf-8'))
  } catch {
    return {}
  }
}
