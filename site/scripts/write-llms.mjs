import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { armarLlmsFull, armarLlmsTxt } from '../src/lib/llms.js'

// Escribe public/llms.txt (y el -full, y las copias en inglés) para que el
// archivo viva en el repo y el build lo copie tal cual, como respond.io.

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dest = join(raiz, 'public')
mkdirSync(join(dest, 'en'), { recursive: true })

const archivos = [
  ['llms.txt', armarLlmsTxt('es')],
  ['llms-full.txt', armarLlmsFull('es')],
  ['en/llms.txt', armarLlmsTxt('en')],
  ['en/llms-full.txt', armarLlmsFull('en')],
]

for (const [rel, cuerpo] of archivos) {
  const texto = cuerpo.endsWith('\n') ? cuerpo : `${cuerpo}\n`
  // BOM: un text/plain sin charset se lee como Latin-1; con BOM Chrome usa UTF-8.
  writeFileSync(join(dest, rel), `\uFEFF${texto}`, 'utf8')
  const bytes = Buffer.byteLength(texto, 'utf8')
  const lineas = texto.split('\n').length
  console.log(`${rel}: ${bytes} bytes, ${lineas} líneas`)
}
