import path from 'node:path'
import { app, ipcMain, shell } from 'electron'

// El login social termina en el navegador del sistema, así que hace falta una
// forma de que la respuesta vuelva a la app. Esa forma es un esquema propio:
// Supabase redirige a `conext://auth?code=…`, Windows ve el esquema registrado
// y levanta la app con esa URL en argv. Como hay lock de instancia única, lo que
// pasa de verdad es que la instancia que ya estaba abierta recibe el argv por
// `second-instance`.
//
// No se puede usar `app://conext` para esto: ese esquema lo entiende Chromium
// adentro de la app, no el sistema operativo.
export const ESQUEMA_OAUTH = 'conext'
const PREFIJO = `${ESQUEMA_OAUTH}://`

export function registrarEsquemaOAuth() {
  if (app.isPackaged) {
    app.setAsDefaultProtocolClient(ESQUEMA_OAUTH)
    return
  }
  // Sin empaquetar, el ejecutable es electron.exe y el "programa" es esta
  // carpeta: registrado pelado, el deep link abriría un Electron vacío en vez
  // de la dashboard.
  app.setAsDefaultProtocolClient(ESQUEMA_OAUTH, process.execPath, [
    path.resolve(process.argv[1] ?? '.'),
  ])
}

// Windows y Linux entregan el deep link como un argumento más de la línea de
// comandos, mezclado con los flags de Chromium.
export function urlDeArgv(argv) {
  return (argv ?? []).find((a) => typeof a === 'string' && a.startsWith(PREFIJO)) ?? null
}

// Abrir el navegador lo hace el proceso principal y no la página, y con la URL
// mirada antes: un `shell.openExternal` con cualquier cosa venida del renderer
// es ejecutar lo que sea con el shell del sistema. Solo pasa la pantalla de
// autorización del Supabase de este build.
export function permitirAbrirOAuth(origenes) {
  const supabase = String(origenes.supabase ?? '').replace(/\/$/, '')

  ipcMain.handle('conext:abrir-oauth', async (_evento, url) => {
    if (typeof url !== 'string') return false
    let destino
    try {
      destino = new URL(url)
    } catch {
      return false
    }
    if (destino.protocol !== 'https:') return false

    // Con `origenes.json` presente se compara contra ese proyecto y nada más.
    // Sin él —la app corriendo contra el Vite de la raíz, donde el archivo
    // puede no existir— alcanza con que sea un proyecto de Supabase.
    const esperado = supabase
      ? destino.origin === supabase
      : /\.supabase\.co$/.test(destino.hostname)
    if (!esperado || !destino.pathname.startsWith('/auth/')) return false

    await shell.openExternal(url)
    return true
  })
}
