import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

// Los archivos viven afuera de la base, en el disco del server. La carpeta se
// scopea por tenant igual que todo lo demás: aunque el acceso ya pasa por el
// id del mensaje, dos clientes nunca comparten directorio.
//
// `UPLOADS_DIR` del entorno es para el host: ahí el único disco que sobrevive a
// un deploy es un volumen montado en una ruta suya, y el resto del filesystem
// se rehace en cada build. Meta borra su copia a los 30 días, así que si esto
// apunta al disco efímero los adjuntos viejos se pierden para siempre.
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads')

// Lo que acepta la Cloud API por tipo. Todo lo que no esté acá se manda como
// documento, que es el único tipo sin lista blanca de formatos: un .webp o un
// .zip llegan igual, solo que como archivo adjunto en vez de inline.
const MIMES = {
  image: ['image/jpeg', 'image/png'],
  video: ['video/mp4', 'video/3gpp'],
  audio: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
}

// Topes de Meta. Pasarse rebota del lado de Graph con un error genérico, así
// que se corta acá donde se puede decir cuál era el límite.
const LIMITES = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  document: 25 * 1024 * 1024,
}

// Extensión por tipo. Sale del mime y no del nombre que subió el usuario: el
// nombre original se guarda aparte para mostrarlo, pero como parte de una ruta
// del filesystem es justo por donde entra un "../..".
const EXTENSIONES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'video/mp4': '.mp4',
  'video/3gpp': '.3gp',
  'audio/aac': '.aac',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/amr': '.amr',
  'audio/ogg': '.ogg',
  'application/pdf': '.pdf',
}

// El navegador manda el mime con parámetros ("audio/webm;codecs=opus") y a veces
// en mayúsculas.
function mimeBase(mime) {
  return String(mime ?? '').split(';')[0].trim().toLowerCase()
}

export function kindForMime(mime) {
  const base = mimeBase(mime)
  for (const [kind, lista] of Object.entries(MIMES)) {
    if (lista.includes(base)) return kind
  }
  return 'document'
}

function extensionPara(mime, nombreOriginal) {
  const base = mimeBase(mime)
  if (EXTENSIONES[base]) return EXTENSIONES[base]
  // Para documentos la extensión del nombre original es la que hace que el
  // archivo abra con el programa correcto del otro lado. Se limita a letras y
  // números para que no se cuele un separador de rutas.
  const ext = path.extname(String(nombreOriginal ?? '')).toLowerCase()
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : '.bin'
}

// Chrome graba en webm y WhatsApp no lo acepta: las notas de voz tienen que ir
// en ogg con codec opus. Adentro del webm el audio ya *es* opus, así que esto
// es un remuxeo — se cambia el contenedor y se copia el stream tal cual, sin
// recomprimir ni perder calidad. Si el navegador grabó en otro codec (no todos
// usan opus), el copy falla y se reintenta recodificando.
const AUDIO_A_CONVERTIR = ['audio/webm', 'audio/x-matroska', 'video/webm']

async function correrFfmpeg(args) {
  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg salió con código ${code}: ${stderr.slice(-400)}`))
    })
  })
}

async function convertirAOgg(origen, destino) {
  try {
    await correrFfmpeg(['-y', '-i', origen, '-vn', '-c:a', 'copy', '-f', 'ogg', destino])
  } catch {
    await correrFfmpeg(['-y', '-i', origen, '-vn', '-c:a', 'libopus', '-b:a', '32k', '-f', 'ogg', destino])
  }
}

// Guarda el adjunto en disco y devuelve lo que hay que persistir en la fila del
// mensaje. Todavía no lo mandó a nadie: eso es del adapter del canal.
export async function guardarAdjunto(tenantId, { buffer, mime, filename }) {
  if (!buffer?.length) throw new Error('El archivo llegó vacío')

  const carpeta = path.join(UPLOADS_DIR, String(tenantId).replace(/[^a-zA-Z0-9_-]/g, ''))
  await fs.mkdir(carpeta, { recursive: true })

  const base = mimeBase(mime)
  const hayQueConvertir = AUDIO_A_CONVERTIR.includes(base)
  const mimeFinal = hayQueConvertir ? 'audio/ogg' : base
  const kind = hayQueConvertir ? 'audio' : kindForMime(mimeFinal)

  const limite = LIMITES[kind]
  if (buffer.length > limite) {
    throw new Error(
      `El archivo pesa ${(buffer.length / 1024 / 1024).toFixed(1)} MB y el máximo para ${kind} es ${limite / 1024 / 1024} MB`,
    )
  }

  const nombreArchivo = `${crypto.randomUUID()}${extensionPara(mimeFinal, filename)}`
  const destino = path.join(carpeta, nombreArchivo)

  if (hayQueConvertir) {
    // ffmpeg necesita un archivo de entrada, no un buffer. El temporal se borra
    // pase lo que pase: si queda, la carpeta se llena de webm que nadie mira.
    const temporal = `${destino}.origen`
    await fs.writeFile(temporal, buffer)
    try {
      await convertirAOgg(temporal, destino)
    } finally {
      await fs.rm(temporal, { force: true })
    }
  } else {
    await fs.writeFile(destino, buffer)
  }

  const { size } = await fs.stat(destino)

  return {
    kind,
    mime: mimeFinal,
    // Relativa a UPLOADS_DIR y siempre con '/': en Windows path.join mete '\',
    // y la misma fila leída desde otra máquina no encontraría el archivo.
    path: `${path.basename(carpeta)}/${nombreArchivo}`,
    name: String(filename ?? '').trim() || nombreArchivo,
    size,
  }
}

// Resuelve la ruta absoluta de lo guardado, verificando que caiga adentro de
// UPLOADS_DIR: la columna la escribimos nosotros, pero es la única defensa si
// alguna vez entra por otro lado.
export function rutaAbsoluta(relativa) {
  const abs = path.resolve(UPLOADS_DIR, relativa)
  if (abs !== UPLOADS_DIR && !abs.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Ruta de adjunto fuera de la carpeta de uploads')
  }
  return abs
}

export async function borrarAdjunto(relativa) {
  if (!relativa) return
  try {
    await fs.rm(rutaAbsoluta(relativa), { force: true })
  } catch (err) {
    console.error('[media] no se pudo borrar el adjunto', relativa, err)
  }
}
