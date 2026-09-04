import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { leerOrigenes } from './origenes.js'

// La dashboard NO se carga con `file://`. Un documento de file:// es un origen
// opaco: `localStorage` queda inservible (ahí viven la sesión, el tema y los
// emojis recientes), `crypto.subtle` no existe —y el PKCE de Supabase lo
// necesita— y cada `fetch` sale con `Origin: null`, que es justo lo que el CORS
// del server rechaza. Así que se sirve por un esquema propio, `app://conext`,
// declarado como estándar y seguro: para Chromium es un origen normal y con
// TLS, igual que https, pero los archivos salen del disco.
export const ESQUEMA = 'app'
export const HOST = 'conext'
export const ORIGEN = `${ESQUEMA}://${HOST}`

// Tiene que correr antes de `app.whenReady()`: después, el esquema ya quedó
// registrado sin privilegios y no se puede cambiar.
export function registrarEsquema() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ESQUEMA,
      privileges: {
        standard: true, // origen con host, no opaco
        secure: true, // cuenta como contexto seguro (crypto.subtle, service workers)
        supportFetchAPI: true,
        stream: true, // audio y video piden el cuerpo de a pedazos
        codeCache: true,
      },
    },
  ])
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
}

// A dónde puede hablar el renderer. La lista sale de `renderer/origenes.json`,
// que escribe el build con los mismos valores que se compilaron adentro del
// bundle: si acá pusiéramos otra cosa, la app cargaría y después toda request
// moriría con un error de CSP que no dice de dónde salió.
function csp(origenes) {
  const api = origenes.api ? [origenes.api] : []
  const supabase = origenes.supabase
    ? [origenes.supabase, origenes.supabase.replace(/^https:/, 'wss:')]
    : []

  return [
    "default-src 'self'",
    "base-uri 'self'",
    // 'unsafe-inline' es por el script del tema que va en el <head> de
    // index.html — sin él, cada arranque pinta un fogonazo blanco antes de que
    // React monte. Lo que sí queda cortado es traer código de otro dominio: la
    // única excepción es el SDK de Facebook, que es lo que usa Configuración
    // para conectar WhatsApp y la Página.
    "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    [
      'connect-src',
      "'self'",
      ...api,
      ...supabase,
      'https://graph.facebook.com',
      'https://www.facebook.com',
      'blob:',
      'data:',
    ].join(' '),
    // El alta embebida de Meta se dibuja adentro de un iframe suyo.
    'frame-src https://www.facebook.com https://web.facebook.com',
    "object-src 'none'",
    // Nada de esta app manda un <form> a ningún lado: todo sale por fetch.
    "form-action 'none'",
  ].join('; ')
}

// `raiz` es la carpeta del build de Vite (desktop/renderer).
export function servirRenderer(raiz) {
  const cabeceras = { 'Content-Security-Policy': csp(leerOrigenes(raiz)) }

  protocol.handle(ESQUEMA, async (peticion) => {
    const url = new URL(peticion.url)
    if (url.host !== HOST) return new Response('No encontrado', { status: 404 })

    // El path llega decodificado y se resuelve *adentro* de la carpeta del
    // build. Sin la comprobación de abajo, un `app://conext/../../../etc/passwd`
    // lee cualquier archivo de la máquina con los permisos de la app.
    const pedido = decodeURIComponent(url.pathname)
    const destino = path.resolve(raiz, '.' + pedido)
    if (destino !== raiz && !destino.startsWith(raiz + path.sep)) {
      return new Response('Prohibido', { status: 403 })
    }

    // Sin router en el frontend no hay rutas profundas que resolver, pero un
    // pedido a la raíz sí tiene que caer en el index.
    const archivo = fs.existsSync(destino) && fs.statSync(destino).isFile()
      ? destino
      : path.join(raiz, 'index.html')

    const res = await net.fetch(pathToFileURL(archivo).toString())
    const tipo = TIPOS[path.extname(archivo).toLowerCase()]

    return new Response(res.body, {
      status: res.status,
      headers: { ...cabeceras, ...(tipo ? { 'Content-Type': tipo } : {}) },
    })
  })
}
