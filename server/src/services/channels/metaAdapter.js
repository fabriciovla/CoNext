import { getMetaCredentials } from '../tenantsService.js'
import { aIdExterno } from './contactId.js'

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'
const GRAPH = () => `https://graph.facebook.com/${GRAPH_VERSION}`

// Instagram y Messenger comparten adapter porque comparten API: los dos son la
// Messenger Platform. Se manda al **mismo** endpoint, `/me/messages`, con el
// mismo token de Página; el "me" lo resuelve Meta a partir del token, así que
// no hay id de origen en la URL y el código de envío es idéntico para los dos.
//
// Lo único que cambia entre canales es de dónde salió el destinatario (IGSID
// contra PSID) y el nombre que ponemos en los errores, para que un fallo diga
// cuál de los dos canales se cayó.
const NOMBRES = { instagram: 'Instagram', messenger: 'Messenger' }

async function graph(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error
    const detalle = err?.error_user_msg || err?.message || `HTTP ${res.status}`
    const e = new Error(detalle)
    e.metaCode = err?.code ?? null
    throw e
  }
  return data
}

// El nombre del contacto no viene en el webhook.
//
// WhatsApp manda `contacts[].profile.name` junto al mensaje; la Messenger
// Platform no manda nada: el payload trae el PSID/IGSID pelado. Sin esta
// consulta, la bandeja mostraría el id numérico como nombre del cliente.
//
// Falla en silencio a propósito: si el permiso de perfil todavía no está
// aprobado, es preferible una conversación con el id por nombre que un mensaje
// que no se guarda.
export async function getContactProfile(tenantId, contactId, channel) {
  const creds = await getMetaCredentials(tenantId)
  if (!creds) return null

  // Instagram devuelve `username`, que es como la persona se conoce a sí misma
  // ahí; Messenger devuelve nombre y apellido por separado.
  const fields = channel === 'instagram' ? 'name,username' : 'first_name,last_name'

  try {
    const data = await graph(`${GRAPH()}/${aIdExterno(contactId)}?fields=${fields}`, {
      headers: { Authorization: `Bearer ${creds.pageAccessToken}` },
    })
    if (channel === 'instagram') return data?.username ?? data?.name ?? null
    return [data?.first_name, data?.last_name].filter(Boolean).join(' ') || null
  } catch (err) {
    console.warn(`[${channel}] no se pudo leer el perfil de ${contactId}: ${err.message}`)
    return null
  }
}

// Un adapter por canal. La firma es la del resolver de canales
// (`sendMessage(conversation, text)`), igual que la de WhatsApp.
export function crearAdapter(channel) {
  const nombre = NOMBRES[channel] ?? channel

  async function sendMessage(conversation, text) {
    const { tenantId } = conversation
    if (!tenantId) throw new Error(`sendMessage necesita el tenantId de la conversación`)

    const creds = await getMetaCredentials(tenantId)

    // Mismo comportamiento que WhatsApp sin credenciales: se simula y se
    // loguea en vez de explotar, así el pipeline se puede probar entero sin
    // tener la app aprobada por Meta.
    if (!creds) {
      console.log(`[DEV][${channel}] simulated send to ${conversation.phone} (tenant ${tenantId}): ${text}`)
      return { externalId: `dev-${Date.now()}` }
    }

    const data = await graph(`${GRAPH()}/me/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // El destinatario va sin nuestro prefijo: Graph quiere el IGSID/PSID
        // tal como lo mandó en el webhook.
        recipient: { id: aIdExterno(conversation.phone) },
        message: { text },
        // Declara que esto contesta un mensaje del cliente, que es lo único
        // que se puede mandar dentro de la ventana de 24h sin etiqueta.
        messaging_type: 'RESPONSE',
      }),
    }).catch((err) => {
      throw new Error(`${nombre} send failed: ${err.message}`)
    })

    return { externalId: data?.message_id ?? null }
  }

  // Los adjuntos no van todavía, y no es el mismo motivo que en WhatsApp.
  //
  // WhatsApp sube el binario a Graph y después cita el id que le devuelven. La
  // Messenger Platform no acepta eso en Instagram: quiere una **URL pública**
  // del archivo. Los nuestros viven en el disco del server, detrás de la API
  // key (`GET /messages/media/:id`), así que Meta no los puede ir a buscar.
  // Falta exponerlos por una URL firmada; hasta entonces esto avisa qué falta
  // en vez de fallar con "is not a function".
  async function sendMedia() {
    throw new Error(
      `El canal de ${nombre} todavía no manda adjuntos: Meta necesita una URL pública del archivo ` +
        'y los nuestros se sirven detrás de la API key.',
    )
  }

  return { sendMessage, sendMedia }
}
