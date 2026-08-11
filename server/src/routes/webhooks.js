import { Router } from 'express'
import db from '../db/index.js'
import { verifyMetaSignature } from '../middleware/verifyMetaSignature.js'
import { handleIncomingMessage, updateDeliveryStatus } from '../services/conversationService.js'

const router = Router()

// Meta's app-review challenge: echo back hub.challenge if the verify token matches.
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge)
  }
  res.sendStatus(403)
})

// WhatsApp Cloud API and Instagram Messaging both post to the same webhook
// URL under one Meta app, in their own payload shapes — this pulls both
// into one normalized event list.
// Acuses de entrega de WhatsApp (sent/delivered/read/failed). Van aparte de
// los mensajes porque no crean nada en la bandeja: solo actualizan el estado
// del saliente que ya está guardado.
function extractStatuses(body) {
  const statuses = []
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        statuses.push({
          externalId: status.id,
          status: status.status,
          // Meta manda los errores como lista; para la bandeja alcanza el
          // primero, que es el que explica por qué no llegó.
          error: status.errors?.[0]
            ? `${status.errors[0].code}: ${status.errors[0].title ?? status.errors[0].message ?? ''}`.trim()
            : null,
        })
      }
    }
  }
  return statuses
}

function normalizeEvents(body) {
  const events = []

  for (const entry of body.entry ?? []) {
    // WhatsApp: entry.changes[].value.{contacts,messages}
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      for (const message of value.messages ?? []) {
        if (message.type !== 'text') continue
        const contact = value.contacts?.find((c) => c.wa_id === message.from)
        events.push({
          phone: message.from,
          channel: 'whatsapp',
          text: message.text?.body ?? '',
          customerName: contact?.profile?.name ?? message.from,
          externalId: message.id,
        })
      }
    }

    // Instagram: entry.messaging[].{sender,message}
    for (const item of entry.messaging ?? []) {
      if (!item.message?.text || item.message.is_echo) continue
      events.push({
        phone: item.sender?.id,
        channel: 'instagram',
        text: item.message.text,
        customerName: item.sender?.id,
        externalId: item.message.mid,
      })
    }
  }

  return events
}

router.post('/meta', verifyMetaSignature, async (req, res) => {
  // Ack immediately — Meta retries aggressively if the webhook is slow, and
  // the AI classification/send happens async after we've already responded.
  res.sendStatus(200)

  // Los acuses van primero y sin dedup: son idempotentes (el rank impide
  // retroceder de estado) y no cuesta nada reprocesarlos.
  for (const { externalId, status, error } of extractStatuses(req.body)) {
    try {
      updateDeliveryStatus(externalId, status, error)
      if (status === 'failed') {
        console.error(`[webhooks/meta] envío fallido (${externalId}): ${error ?? 'sin detalle'}`)
      }
    } catch (err) {
      console.error('[webhooks/meta] no se pudo actualizar el estado de entrega:', err)
    }
  }

  const events = normalizeEvents(req.body)
  const seen = db.prepare('SELECT id FROM webhook_events WHERE id = ?')
  const markSeen = db.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)')

  for (const event of events) {
    if (!event.phone || !event.text) continue
    if (event.externalId && seen.get(event.externalId)) continue
    if (event.externalId) markSeen.run(event.externalId, new Date().toISOString())

    try {
      await handleIncomingMessage(event)
    } catch (err) {
      console.error('[webhooks/meta] failed to process incoming message:', err)
    }
  }
})

export default router
