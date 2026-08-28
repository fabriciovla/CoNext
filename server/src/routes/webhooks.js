import { Router } from 'express'
import { run } from '../db/index.js'
import { verifyMetaSignature } from '../middleware/verifyMetaSignature.js'
import { verifyDodoSignature } from '../middleware/verifyDodoSignature.js'
import { handleIncomingMessage, updateDeliveryStatus } from '../services/conversationService.js'
import { getTenantByPhoneNumberId } from '../services/tenantsService.js'
import { EVENTOS_ALTA, EVENTOS_BAJA, guardarEvento } from '../services/dodoService.js'

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

// Todos los clientes entran por esta misma URL: es una sola app de Meta con una
// sola suscripción. Lo único que dice de quién es cada mensaje es el
// phone_number_id que Meta pone en value.metadata — de ahí sale el tenant.
//
// Si no resuelve, el evento se descarta: un mensaje que no se puede atribuir a
// nadie no se puede guardar en ningún lado, y adivinar sería escribirlo en la
// bandeja del cliente equivocado.
function extractWhatsappChanges(body) {
  const cambios = []
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      const phoneNumberId = value.metadata?.phone_number_id
      if (!phoneNumberId) continue
      cambios.push({ phoneNumberId, value })
    }
  }
  return cambios
}

// Acuses de entrega de WhatsApp (sent/delivered/read/failed). Van aparte de
// los mensajes porque no crean nada en la bandeja: solo actualizan el estado
// del saliente que ya está guardado.
function extractStatuses(value) {
  return (value.statuses ?? []).map((status) => ({
    externalId: status.id,
    status: status.status,
    // Meta manda los errores como lista; para la bandeja alcanza el primero,
    // que es el que explica por qué no llegó.
    error: status.errors?.[0]
      ? `${status.errors[0].code}: ${status.errors[0].title ?? status.errors[0].message ?? ''}`.trim()
      : null,
  }))
}

function extractMessages(value) {
  const events = []
  for (const message of value.messages ?? []) {
    if (message.type !== 'text') {
      // Audios, fotos y ubicaciones se descartan. Queda logueado a propósito:
      // antes desaparecían en silencio y el cliente quedaba esperando una
      // respuesta que nadie sabía que tenía que dar.
      console.warn(`[webhooks/meta] mensaje de tipo "${message.type}" ignorado (solo se procesa texto)`)
      continue
    }
    const contact = value.contacts?.find((c) => c.wa_id === message.from)
    events.push({
      phone: message.from,
      channel: 'whatsapp',
      text: message.text?.body ?? '',
      customerName: contact?.profile?.name ?? message.from,
      externalId: message.id,
    })
  }
  return events
}

router.post('/meta', verifyMetaSignature, async (req, res) => {
  // Ack immediately — Meta retries aggressively if the webhook is slow, and
  // the AI classification/send happens async after we've already responded.
  res.sendStatus(200)

  // Instagram (entry[].messaging[]) queda sin procesar: el canal está dormido y
  // todavía no hay columna en `tenants` que ate una cuenta de IG a un cliente,
  // así que no habría forma de atribuir el mensaje.
  if (req.body.entry?.some((e) => e.messaging)) {
    console.warn('[webhooks/meta] evento de Instagram recibido, todavía sin soporte multi-cliente')
  }

  for (const { phoneNumberId, value } of extractWhatsappChanges(req.body)) {
    let tenant
    try {
      tenant = await getTenantByPhoneNumberId(phoneNumberId)
    } catch (err) {
      console.error('[webhooks/meta] no se pudo resolver el tenant:', err)
      continue
    }

    if (!tenant) {
      console.warn(
        `[webhooks/meta] llegó un evento para phone_number_id ${phoneNumberId} que no ` +
          'corresponde a ningún cliente activo; se descarta',
      )
      continue
    }

    // Los acuses van primero y sin dedup: son idempotentes (el rank impide
    // retroceder de estado) y no cuesta nada reprocesarlos.
    for (const { externalId, status, error } of extractStatuses(value)) {
      try {
        await updateDeliveryStatus(tenant.id, externalId, status, error)
        if (status === 'failed') {
          console.error(`[webhooks/meta] envío fallido (${externalId}): ${error ?? 'sin detalle'}`)
        }
      } catch (err) {
        console.error('[webhooks/meta] no se pudo actualizar el estado de entrega:', err)
      }
    }

    for (const event of extractMessages(value)) {
      if (!event.phone || !event.text) continue

      try {
        if (event.externalId) {
          // El INSERT hace de dedup: si el wamid ya estaba, no toca ninguna fila
          // y salimos. Reemplaza al par SELECT-después-INSERT, que con dos
          // entregas simultáneas del mismo evento dejaba pasar las dos.
          const filas = await run(
            `INSERT INTO webhook_events (id, tenant_id, received_at) VALUES ($1, $2, $3)
             ON CONFLICT (id) DO NOTHING`,
            [event.externalId, tenant.id, new Date().toISOString()],
          )
          if (filas === 0) continue
        }

        await handleIncomingMessage(tenant.id, event)
      } catch (err) {
        console.error('[webhooks/meta] failed to process incoming message:', err)
      }
    }
  }
})

// Dodo Payments: pagos y ciclo de vida de las suscripciones. Va acá y no en un
// router propio porque comparte el motivo de /webhooks — lo firma un tercero y
// no puede mandar nuestra API key, así que tiene que quedar antes de
// resolveTenant.
//
// La diferencia con el de Meta es de quién habla. El de Meta trae mensajes de
// un cliente que ya existe y resuelve su tenant por el phone_number_id. Este
// trae a alguien que todavía no es cliente de nada —el tenant es justamente lo
// que hay que crear después—, así que no resuelve nada: guarda y deja cola.
router.post('/dodo', verifyDodoSignature, async (req, res) => {
  // Igual que Meta, Dodo reintenta si tardamos: se contesta primero y se
  // procesa después. La firma ya se validó, así que este 200 no le está
  // diciendo que sí a un desconocido.
  res.sendStatus(200)

  const webhookId = req.get('webhook-id')

  try {
    const evento = await guardarEvento(webhookId, req.body)

    // Reintento de Dodo o reenvío a mano desde su dashboard: ya lo teníamos.
    if (!evento.nuevo) return

    if (EVENTOS_ALTA.has(evento.tipo)) {
      // Todavía no se provisiona solo: el alta sigue siendo `npm run tenant`.
      // Queda gritado en el log para que no pase inadvertido, porque del otro
      // lado hay alguien que ya pagó y está esperando poder entrar.
      console.warn(
        `[webhooks/dodo] ${evento.tipo} de ${evento.email ?? 'sin email'} ` +
          `(plan ${evento.plan ?? 'sin identificar'}) — falta dar de alta el cliente`,
      )
      return
    }

    if (EVENTOS_BAJA.has(evento.tipo)) {
      console.warn(
        `[webhooks/dodo] ${evento.tipo} de ${evento.email ?? 'sin email'} ` +
          `(suscripción ${evento.subscriptionId ?? 'sin id'}) — el acceso no se corta solo`,
      )
      return
    }

    console.log(`[webhooks/dodo] evento ${evento.tipo} guardado`)
  } catch (err) {
    // Ya contestamos 200. Si el INSERT falló, la fila no quedó, así que el
    // reintento de Dodo lo vuelve a intentar y esta vez no hay dedup que lo
    // descarte — que es exactamente lo que queremos que pase.
    console.error('[webhooks/dodo] no se pudo guardar el evento:', err)
  }
})

export default router
