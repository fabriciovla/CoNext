import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { one } from '../db/index.js'
import { enviarCorreo, escaparHtml } from './email.js'
import { MASCOTA_CID, asuntoPostulacionRecibida, postulacionRecibidaHtml } from './emailTemplates.js'

const MASCOTA_PATH = fileURLToPath(new URL('../assets/mascota-postulate.png', import.meta.url))
const IDIOMAS = new Set(['es', 'en'])

// El campo "contacto" es de texto libre (correo o WhatsApp, aclara el
// placeholder del form): el agradecimiento por correo solo sale cuando de
// verdad parece una dirección. Mismo criterio flojo que `normalizarCorreo` de
// altasService — acá tampoco se está autenticando a nadie.
function pareceCorreo(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)
}

function texto(valor, tope = 200) {
  if (valor == null) return null
  const s = String(valor).trim()
  if (!s) return null
  return s.slice(0, tope)
}

export async function guardarPostulacion({ nombre, contacto, negocio, idioma }) {
  const nombreLimpio = texto(nombre)
  const contactoLimpio = texto(contacto)
  if (!nombreLimpio || !contactoLimpio) {
    const err = new Error('Faltan datos')
    err.status = 400
    throw err
  }
  // El idioma lo manda la página (/postulate = es, /en/postulate = en) y no
  // el navegador de quien completa el form: es el mismo criterio que ya usa
  // `settings.ai_language`, texto libre validado contra un allow-list y no
  // contra `Accept-Language`, que dice el idioma del visitante y no el de la
  // página que de verdad leyó.
  const idiomaLimpio = IDIOMAS.has(idioma) ? idioma : 'es'

  const id = `postulacion-${randomUUID()}`
  const now = new Date().toISOString()

  const fila = await one(
    `INSERT INTO postulaciones (id, nombre, contacto, negocio, idioma, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at AS "createdAt"`,
    [id, nombreLimpio, contactoLimpio, texto(negocio), idiomaLimpio, now],
  )

  // Los dos correos son al margen: sin RESEND_API_KEY no se manda nada, y si
  // Resend falla la postulación ya quedó guardada — un correo que no salió no
  // puede tirar abajo el POST que la persona que se postuló sí ve como exitoso.
  enviarCorreo({
    to: process.env.POSTULACIONES_EMAIL || 'contact@conext.lat',
    subject: `Nueva postulación: ${nombreLimpio}`,
    html: `<p><strong>Nombre:</strong> ${escaparHtml(nombreLimpio)}</p><p><strong>Contacto:</strong> ${escaparHtml(contactoLimpio)}</p><p><strong>Idioma:</strong> ${idiomaLimpio}</p>`,
  }).catch((err) => console.error('No se pudo avisar la postulación por correo', err))

  if (pareceCorreo(contactoLimpio)) {
    enviarAgradecimiento(contactoLimpio, nombreLimpio, idiomaLimpio).catch((err) =>
      console.error('No se pudo mandar el agradecimiento de la postulación', err),
    )
  }

  return fila
}

async function enviarAgradecimiento(contacto, nombre, idioma) {
  const mascota = await readFile(MASCOTA_PATH)
  await enviarCorreo({
    to: contacto,
    subject: asuntoPostulacionRecibida(idioma),
    html: postulacionRecibidaHtml({ nombre, idioma }),
    attachments: [
      {
        filename: 'mascota-postulate.png',
        content: mascota.toString('base64'),
        content_id: MASCOTA_CID,
      },
    ],
  })
}
