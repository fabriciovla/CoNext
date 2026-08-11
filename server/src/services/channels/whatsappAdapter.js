const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v21.0'

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
// WhatsApp va por la Cloud API de Meta directo (sin BSP intermediario).
// Los mensajes de texto libre solo salen dentro de la ventana de servicio de
// 24h que abre el cliente al escribirnos; como el CRM siempre responde a un
// entrante, estamos dentro de esa ventana y no hacen falta plantillas.
export async function sendMessage(conversation, text) {
  const token = process.env.WA_ACCESS_TOKEN
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.log(`[DEV][whatsapp] simulated send to ${conversation.phone}: ${text}`)
    return { externalId: `dev-${Date.now()}` }
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
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
