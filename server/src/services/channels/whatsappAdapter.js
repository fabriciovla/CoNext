import fs from 'node:fs/promises'
import { getWhatsappCredentials } from '../tenantsService.js'
import { rutaAbsoluta } from '../mediaService.js'

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'

// El webhook de Meta entrega el remitente como wa_id (dígitos, sin '+'), pero
// los teléfonos cargados a mano o por seed suelen traer '+' y espacios. Graph
// acepta ambos, así que normalizamos para no depender de por dónde entró.
function toWaId(phone) {
  return String(phone).replace(/\D/g, '')
}

// Solo desarrollo. La allow list del número de prueba compara el string crudo
// antes de normalizar, y en Argentina el wa_id que manda el webhook (549…) no
// coincide con el número que la consola guarda (54…15…): son el mismo teléfono
// para WhatsApp pero dos strings distintos para la validación. Formato:
// "waId:destino,waId:destino". Vacío (producción) = no hace nada.
//
// Es global y no por cliente a propósito: solo sirve con el número de prueba de
// Meta, que es uno solo. En producción no hay allow list y esto queda vacío.
function applyDevRecipientMap(waId) {
  const raw = process.env.WA_DEV_RECIPIENT_MAP
  if (!raw) return waId

  for (const pair of raw.split(',')) {
    const [from, to] = pair.split(':').map((s) => s.trim())
    if (from === waId && to) {
      console.log(`[DEV][whatsapp] allow list: ${waId} -> ${to}`)
      return to
    }
  }
  return waId
}

// sendMessage(conversation, text) -> Promise<{ externalId: string }>
//
// Las credenciales salen del tenant, no del .env: con varios negocios en la
// misma instancia, un token global mandaría todos los mensajes desde el mismo
// número. Las puebla Embedded Signup en el alta de cada cliente.
//
// Los mensajes de texto libre solo salen dentro de la ventana de servicio de
// 24h que abre el cliente al escribirnos. Hoy el CRM responde a un entrante, así
// que casi siempre está dentro — pero no siempre: un borrador que queda
// pendiente y se manda al día siguiente cae fuera y Meta lo rechaza. Por eso
// `conversations.last_inbound_at` guarda cuándo se abrió la ventana; falta el
// paso de elegir plantilla cuando ya venció.
export async function sendMessage(conversation, text) {
  const { tenantId } = conversation
  if (!tenantId) throw new Error('sendMessage necesita el tenantId de la conversación')

  const creds = await getWhatsappCredentials(tenantId)

  if (!creds) {
    console.log(`[DEV][whatsapp] simulated send to ${conversation.phone} (tenant ${tenantId}): ${text}`)
    return { externalId: `dev-${Date.now()}` }
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: applyDevRecipientMap(toWaId(conversation.phone)),
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  })

  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { externalId: data.messages?.[0]?.id ?? null }
}

// sendMedia(conversation, media) -> Promise<{ externalId: string }>
//
// Mandar un adjunto son dos llamadas, no una: primero se sube el archivo a
// /media y Meta devuelve un id, y recién después se manda el mensaje citando ese
// id. Meta guarda el binario 30 días; nuestra copia en disco es la que sostiene
// el hilo después de eso.
//
// `media` es lo que devuelve `guardarAdjunto`: { kind, mime, path, name }.
export async function sendMedia(conversation, media, caption = '') {
  const { tenantId } = conversation
  if (!tenantId) throw new Error('sendMedia necesita el tenantId de la conversación')

  const creds = await getWhatsappCredentials(tenantId)

  if (!creds) {
    console.log(
      `[DEV][whatsapp] simulated ${media.kind} to ${conversation.phone} (tenant ${tenantId}): ${media.name}`,
    )
    return { externalId: `dev-${Date.now()}` }
  }

  const bytes = await fs.readFile(rutaAbsoluta(media.path))

  const form = new FormData()
  form.append('messaging_product', 'whatsapp')
  form.append('type', media.mime)
  // El tercer argumento es el filename de la parte del multipart. Sin él, Graph
  // rechaza la subida: no es un campo de texto, tiene que llegar como archivo.
  form.append('file', new Blob([bytes], { type: media.mime }), media.name)

  const subida = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/media`, {
    method: 'POST',
    // Sin Content-Type a mano: lo pone fetch con el boundary del FormData.
    headers: { Authorization: `Bearer ${creds.accessToken}` },
    body: form,
  })

  if (!subida.ok) {
    throw new Error(`WhatsApp media upload failed: ${subida.status} ${await subida.text()}`)
  }

  const { id: mediaId } = await subida.json()
  if (!mediaId) throw new Error('WhatsApp media upload no devolvió un id')

  // El audio no acepta epígrafe (es una nota de voz, no una imagen con texto) y
  // el documento sí acepta filename, que es el nombre con el que se descarga
  // del otro lado.
  const cuerpo = { id: mediaId }
  if (caption && media.kind !== 'audio') cuerpo.caption = caption
  if (media.kind === 'document') cuerpo.filename = media.name

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: applyDevRecipientMap(toWaId(conversation.phone)),
      type: media.kind,
      [media.kind]: cuerpo,
    }),
  })

  if (!res.ok) {
    throw new Error(`WhatsApp send failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return { externalId: data.messages?.[0]?.id ?? null }
}
