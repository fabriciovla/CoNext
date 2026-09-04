import dns from 'node:dns/promises'
import path from 'node:path'
import { extraerPdf } from './pdf.js'

// De un archivo o de una URL a un bloque de texto. Es lo único que se guarda:
// ver el comentario de `content` en la migración 013.

// Tope por fuente. No es el límite del disco sino el del prompt: todo lo que se
// carga acá viaja en cada llamada al modelo, así que una fuente que se pasa no
// se corta sola en silencio — se avisa, y quien la sube decide qué recortar.
export const MAX_CHARS = 40_000

// El archivo entero, antes de extraer. Un PDF de 10 MB es casi siempre un
// escaneo (o sea, imágenes), que es justo de lo que no se puede sacar texto.
export const MAX_ARCHIVO = 10 * 1024 * 1024

// Lo que sabemos leer. El resto se rechaza nombrando el formato: un .docx que
// falla en silencio deja a alguien esperando que el agente conteste con algo
// que nunca entró.
const TEXTO_PLANO = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/tab-separated-values',
  'application/json',
  'application/x-ndjson',
]

const EXTENSIONES_TEXTO = ['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.log', '.rtf']

function mimeBase(mime) {
  return String(mime ?? '').split(';')[0].trim().toLowerCase()
}

// Entidades: las cinco que aparecen en cualquier página más el espacio duro,
// que es el que deja "&nbsp;" desparramado adentro del texto de un agente.
const ENTIDADES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
}

export function textoDeHtml(html) {
  return String(html)
    // El contenido de estos no es texto de la página: es código y estilos, y
    // adentro de un prompt es ruido que además se lleva la mitad del cupo.
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Los bloques cortan renglón; el resto de las etiquetas son un espacio, o
    // dos palabras separadas por un <b> terminarían pegadas.
    .replace(/<\/?(p|div|br|li|tr|h[1-6]|section|article|header|footer|table)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+|#\d+);/gi, (entero, nombre) => ENTIDADES[nombre.toLowerCase()] ?? entero)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function tituloDeHtml(html) {
  const m = /<title[^>]*>([\s\S]{1,200}?)<\/title>/i.exec(String(html))
  return m ? textoDeHtml(m[1]).slice(0, 120) : ''
}

function recortar(texto) {
  // El BOM de un .txt guardado en Windows entra como carácter y queda pegado a
  // la primera palabra del documento; los CRLF se normalizan acá y no en cada
  // extractor.
  const limpio = String(texto ?? '')
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .trim()
  if (!limpio) return ''
  return limpio.length > MAX_CHARS ? `${limpio.slice(0, MAX_CHARS)}\n…` : limpio
}

// Un error que la pantalla puede mostrar tal cual. El resto de los errores del
// server son nuestros; estos son del archivo que subió la persona, así que
// dicen qué pasó y qué hacer.
export class ErrorDeFuente extends Error {}

export function extraerDeArchivo({ buffer, mime, filename }) {
  if (!buffer?.length) throw new ErrorDeFuente('El archivo llegó vacío')
  if (buffer.length > MAX_ARCHIVO) {
    throw new ErrorDeFuente(
      `El archivo pesa ${(buffer.length / 1024 / 1024).toFixed(1)} MB y el máximo es ${MAX_ARCHIVO / 1024 / 1024} MB`,
    )
  }

  const base = mimeBase(mime)
  const ext = path.extname(String(filename ?? '')).toLowerCase()
  const nombre = String(filename ?? '').trim() || 'documento'

  let contenido = null

  if (base === 'application/pdf' || ext === '.pdf') {
    contenido = extraerPdf(buffer)
    if (!contenido) {
      throw new ErrorDeFuente(
        'No pudimos leer el texto de este PDF. Suele pasar con los escaneados (son imágenes): copiá el texto y pegalo como fuente de tipo texto.',
      )
    }
  } else if (base === 'text/html' || ['.html', '.htm'].includes(ext)) {
    contenido = textoDeHtml(buffer.toString('utf8'))
  } else if (base.startsWith('text/') || TEXTO_PLANO.includes(base) || EXTENSIONES_TEXTO.includes(ext)) {
    contenido = buffer.toString('utf8')
  } else {
    throw new ErrorDeFuente(
      `No sabemos leer ${ext || base || 'ese formato'}. Por ahora entran PDF, TXT, MD, CSV, JSON y HTML.`,
    )
  }

  const texto = recortar(contenido)
  if (!texto) throw new ErrorDeFuente('El archivo no tiene texto adentro')

  return { titulo: nombre, origen: nombre, contenido: texto }
}

// Rangos que no salen a internet. Traer una URL que escribe el usuario es pedirle
// al server que haga una request en su nombre: sin este corte, `http://169.254.169.254/`
// le devuelve las credenciales del host y `http://localhost:3001/` la propia API
// con los privilegios del server. Se valida la IP y no el nombre, porque un
// dominio cualquiera puede resolver a 127.0.0.1.
function esPrivada(ip) {
  if (/^127\.|^10\.|^169\.254\.|^192\.168\.|^0\./.test(ip)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true
  if (ip === '::1' || ip === '::' ) return true
  // IPv6: loopback, link-local (fe80::/10) y las únicas locales (fc00::/7).
  if (/^f[cd]/i.test(ip) || /^fe[89ab]/i.test(ip)) return true
  return false
}

async function chequearDestino(url) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ErrorDeFuente('El enlace tiene que empezar con http:// o https://')
  }
  let direcciones
  try {
    direcciones = await dns.lookup(url.hostname, { all: true })
  } catch {
    throw new ErrorDeFuente(`No pudimos resolver ${url.hostname}. ¿Está bien escrita la dirección?`)
  }
  if (direcciones.some((d) => esPrivada(d.address))) {
    throw new ErrorDeFuente('Ese enlace apunta a una dirección interna y no se puede leer desde acá')
  }
}

// La redirección se sigue a mano y no con el `redirect: 'follow'` de fetch: el
// chequeo de arriba vale para la URL que se pidió, y una redirección a
// 127.0.0.1 lo saltearía entero.
const MAX_SALTOS = 4
const TIMEOUT_MS = 12_000

export async function extraerDeEnlace(entrada) {
  let url
  try {
    url = new URL(String(entrada).trim())
  } catch {
    throw new ErrorDeFuente('Esa no es una dirección válida')
  }

  let res
  for (let salto = 0; salto <= MAX_SALTOS; salto += 1) {
    await chequearDestino(url)

    const corte = AbortSignal.timeout(TIMEOUT_MS)
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: corte,
        headers: {
          // Sin User-Agent hay sitios que contestan 403. El nuestro dice quién
          // es: no estamos disfrazándonos de navegador.
          'User-Agent': 'conext-crm/1.0 (+https://conext.lat)',
          Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5',
        },
      })
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new ErrorDeFuente('La página tardó demasiado en contestar')
      }
      throw new ErrorDeFuente(`No pudimos abrir el enlace (${err?.message ?? 'sin detalle'})`)
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url)
      continue
    }
    break
  }

  if (!res.ok) {
    throw new ErrorDeFuente(`La página contestó ${res.status}. Revisá que sea pública.`)
  }

  const tipo = mimeBase(res.headers.get('content-type'))
  if (tipo && !tipo.startsWith('text/') && !TEXTO_PLANO.includes(tipo) && tipo !== 'application/pdf') {
    throw new ErrorDeFuente(`Ese enlace devuelve ${tipo}, y de eso no se puede sacar texto`)
  }

  // El cuerpo entra completo en memoria, así que el tope va antes de leerlo: la
  // cabecera se puede mentir, pero cortar por ahí evita el caso normal de un
  // archivo enorme, y el `slice` de abajo tapa el resto.
  const bytes = Buffer.from((await res.arrayBuffer()).slice(0, MAX_ARCHIVO))

  if (tipo === 'application/pdf') {
    const texto = recortar(extraerPdf(bytes) ?? '')
    if (!texto) throw new ErrorDeFuente('No pudimos leer el texto de ese PDF')
    return { titulo: url.pathname.split('/').filter(Boolean).pop() || url.hostname, origen: url.href, contenido: texto }
  }

  const html = bytes.toString('utf8')
  const contenido = recortar(tipo === 'text/plain' ? html : textoDeHtml(html))
  if (!contenido) throw new ErrorDeFuente('Esa página no tiene texto para leer')

  return {
    titulo: tituloDeHtml(html) || url.hostname,
    origen: url.href,
    contenido,
  }
}

export function extraerDeTexto({ titulo, contenido }) {
  const texto = recortar(contenido)
  if (!texto) throw new ErrorDeFuente('El texto llegó vacío')
  return { titulo: String(titulo ?? '').trim() || 'Nota', origen: '', contenido: texto }
}
