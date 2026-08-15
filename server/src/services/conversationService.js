import crypto from 'node:crypto'
import { one, many, run } from '../db/index.js'
import { getOpenDay } from './dayService.js'
import { classifyAndDraft } from './ai/classifyAndDraft.js'
import { getSettings } from './settingsService.js'
import { getProducts } from './productsService.js'
import { getEnabledAgents, getAgentByKey } from './agentsService.js'
import { resolveAdapter } from './channels/index.js'
import { isWithinBusinessHours } from './businessHours.js'
import { borrarAdjunto } from './mediaService.js'
import { MESSAGE_COLUMNS } from './messageColumns.js'

// Cada cuánto se repite el aviso de "estamos cerrados" a un mismo contacto.
// WhatsApp Business manda el suyo una vez por conversación por período; acá
// alcanza con no repetirlo si el cliente escribe varias veces seguidas.
const AWAY_COOLDOWN_MS = 12 * 60 * 60 * 1000

// Orden de los estados de entrega de Meta. Los eventos pueden llegar
// desordenados (un 'sent' después de un 'read' si se demoró en la red), así
// que nunca se retrocede: sin esto, un mensaje ya leído volvería a "enviado".
const DELIVERY_RANK = { sent: 1, delivered: 2, read: 3, failed: 4 }

// Los mensajes salientes se identifican con el wamid que devolvió Meta al
// enviarlos, que es el mismo id que después viaja en el evento de estado.
export async function updateDeliveryStatus(tenantId, externalId, status, error = null) {
  if (!externalId || !DELIVERY_RANK[status]) return null

  const row = await one(
    'SELECT id, delivery_status AS actual FROM messages WHERE tenant_id = $1 AND external_id = $2',
    [tenantId, externalId],
  )
  if (!row) return null // no es nuestro, o es un mensaje anterior a esta tabla

  const rankActual = DELIVERY_RANK[row.actual] ?? 0
  if (DELIVERY_RANK[status] < rankActual) return null

  await run('UPDATE messages SET delivery_status = $1, delivery_error = $2 WHERE tenant_id = $3 AND id = $4', [
    status,
    error,
    tenantId,
    row.id,
  ])
  return row.id
}

async function mostRecentDayId(tenantId) {
  const open = await getOpenDay(tenantId)
  if (open) return open.id
  const row = await one('SELECT id FROM days WHERE tenant_id = $1 ORDER BY opened_at DESC LIMIT 1', [tenantId])
  return row?.id ?? null
}

export async function getConversation(tenantId, phone) {
  return one('SELECT * FROM conversations WHERE tenant_id = $1 AND phone = $2', [tenantId, phone])
}

export async function ensureConversation(tenantId, phone, { channel = 'whatsapp', customer }) {
  const now = new Date().toISOString()

  // Upsert en vez de leer-y-después-insertar: dos mensajes del mismo contacto
  // entrando a la vez pasaban los dos por el "no existe" y el segundo INSERT
  // reventaba contra la clave primaria.
  await run(
    `INSERT INTO conversations (tenant_id, phone, channel, customer, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (tenant_id, phone) DO NOTHING`,
    [tenantId, phone, channel, customer, now],
  )
  return getConversation(tenantId, phone)
}

async function insertMessage(tenantId, row) {
  // `media` es opcional: los mensajes de texto no la traen y las cuatro
  // columnas quedan en null.
  const r = { agentKey: null, media: null, ...row }
  await run(
    `INSERT INTO messages (tenant_id, id, phone, customer, text, direction, type, status, author, agent_key, external_id, day_id, created_at,
                           media_kind, media_path, media_mime, media_name, media_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      tenantId,
      r.id,
      r.phone,
      r.customer,
      r.text,
      r.direction,
      r.type,
      r.status,
      r.author,
      r.agentKey,
      r.externalId,
      r.dayId,
      r.createdAt,
      r.media?.kind ?? null,
      r.media?.path ?? null,
      r.media?.mime ?? null,
      r.media?.name ?? null,
      r.media?.size ?? null,
    ],
  )
  return one(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE tenant_id = $1 AND id = $2`, [tenantId, r.id])
}

export async function resolveConversation(tenantId, phone) {
  const open = await getOpenDay(tenantId)
  if (!open) return getOpenMessagesForPhone(tenantId, phone)

  await run(
    `UPDATE messages SET status = 'resuelto'
     WHERE tenant_id = $1 AND phone = $2 AND direction = 'in' AND status = 'pendiente' AND day_id = $3`,
    [tenantId, phone, open.id],
  )
  return getOpenMessagesForPhone(tenantId, phone)
}

async function getOpenMessagesForPhone(tenantId, phone) {
  const open = await getOpenDay(tenantId)
  if (!open) return []
  return many(
    `SELECT ${MESSAGE_COLUMNS} FROM messages
     WHERE tenant_id = $1 AND day_id = $2 AND phone = $3 ORDER BY created_at ASC`,
    [tenantId, open.id, phone],
  )
}

async function clearDraft(tenantId, phone) {
  await run(
    `UPDATE conversations SET ai_draft = NULL, ai_draft_created_at = NULL, ai_draft_category = NULL, updated_at = $1
     WHERE tenant_id = $2 AND phone = $3`,
    [new Date().toISOString(), tenantId, phone],
  )
}

// Used both for the admin typing a reply by hand and for the AI auto-sending
// one: same channel adapter, same bookkeeping, only `author` differs.
export async function sendOutboundMessage(tenantId, phone, text, author, agentKey = null) {
  const open = await getOpenDay(tenantId)
  if (!open) throw new Error('No hay un día abierto')

  const conversation = await getConversation(tenantId, phone)
  if (!conversation) throw new Error(`Conversación desconocida: ${phone}`)

  const adapter = resolveAdapter(conversation.channel)
  const { externalId } = await adapter.sendMessage({ tenantId, phone, channel: conversation.channel }, text)

  const message = await insertMessage(tenantId, {
    id: `${author}-${crypto.randomUUID()}`,
    phone,
    customer: conversation.customer,
    text,
    direction: 'out',
    type: null,
    status: null,
    author,
    // Solo las respuestas del bot llevan agente: lo que escribe el admin a mano
    // es del admin, no del agente que venía atendiendo.
    agentKey: author === 'bot' ? agentKey : null,
    externalId: externalId ?? null,
    dayId: open.id,
    createdAt: new Date().toISOString(),
  })

  await clearDraft(tenantId, phone)
  await run('UPDATE conversations SET updated_at = $1 WHERE tenant_id = $2 AND phone = $3', [
    new Date().toISOString(),
    tenantId,
    phone,
  ])
  return message
}

// Envío de un adjunto ya guardado en disco (lo que devuelve `guardarAdjunto`).
// El epígrafe viaja como el `text` del mensaje: en el hilo se lee igual que
// cualquier otro, con el archivo arriba.
//
// Si algo falla se borra el archivo antes de propagar. Sin esto, cada envío
// rechazado por Meta (formato, tamaño, ventana de 24h vencida) dejaría un
// archivo huérfano en el disco al que ninguna fila apunta.
export async function sendOutboundMedia(tenantId, phone, media, caption = '', author = 'admin') {
  try {
    const open = await getOpenDay(tenantId)
    if (!open) throw new Error('No hay un día abierto')

    const conversation = await getConversation(tenantId, phone)
    if (!conversation) throw new Error(`Conversación desconocida: ${phone}`)

    const adapter = resolveAdapter(conversation.channel)
    const { externalId } = await adapter.sendMedia(
      { tenantId, phone, channel: conversation.channel },
      media,
      caption,
    )

    const message = await insertMessage(tenantId, {
      id: `${author}-${crypto.randomUUID()}`,
      phone,
      customer: conversation.customer,
      // El audio no lleva epígrafe (Meta no lo acepta en una nota de voz), así
      // que tampoco se guarda uno que el cliente nunca vio.
      text: media.kind === 'audio' ? '' : caption,
      direction: 'out',
      type: null,
      status: null,
      author,
      externalId: externalId ?? null,
      dayId: open.id,
      createdAt: new Date().toISOString(),
      media,
    })

    await clearDraft(tenantId, phone)
    await run('UPDATE conversations SET updated_at = $1 WHERE tenant_id = $2 AND phone = $3', [
      new Date().toISOString(),
      tenantId,
      phone,
    ])
    return message
  } catch (err) {
    await borrarAdjunto(media?.path)
    throw err
  }
}

// El archivo se sirve por el id del mensaje y no por su ruta: es la forma de
// que la consulta lleve el tenant adentro y nadie pueda pedir el adjunto de
// otro cliente conociendo un nombre de archivo.
export async function getMessageMedia(tenantId, id) {
  return one(
    `SELECT media_path AS "path", media_mime AS "mime", media_name AS "name", media_kind AS "kind"
     FROM messages WHERE tenant_id = $1 AND id = $2 AND media_path IS NOT NULL`,
    [tenantId, id],
  )
}

// Aviso de fuera de horario. No pasa por sendOutboundMessage a propósito: ese
// exige un día abierto, y justamente si estamos cerrados lo más probable es que
// no lo haya. Un fallo acá no puede tumbar el procesamiento del entrante, así
// que devuelve null en vez de propagar.
async function sendAwayMessage(tenantId, conversation, settings) {
  const text = settings?.awayMessage?.trim()
  if (!text) return null

  const dayId = await mostRecentDayId(tenantId)
  if (!dayId) return null

  // Reserva del aviso en una sola sentencia: si dos mensajes del mismo contacto
  // entran a la vez, solo uno consigue el UPDATE y el otro sale con 0 filas.
  // Chequear y después escribir por separado dejaba pasar los dos.
  const now = new Date().toISOString()
  const limite = new Date(Date.now() - AWAY_COOLDOWN_MS).toISOString()
  const filas = await run(
    `UPDATE conversations SET away_sent_at = $1, updated_at = $1
     WHERE tenant_id = $2 AND phone = $3 AND (away_sent_at IS NULL OR away_sent_at < $4)`,
    [now, tenantId, conversation.phone, limite],
  )

  if (filas === 0) return null

  try {
    const adapter = resolveAdapter(conversation.channel)
    const { externalId } = await adapter.sendMessage(
      { tenantId, phone: conversation.phone, channel: conversation.channel },
      text,
    )

    return await insertMessage(tenantId, {
      id: `ausencia-${crypto.randomUUID()}`,
      phone: conversation.phone,
      customer: conversation.customer,
      text,
      direction: 'out',
      type: null,
      status: null,
      author: 'bot',
      externalId: externalId ?? null,
      dayId,
      createdAt: now,
    })
  } catch (err) {
    // El envío falló: devolvemos la reserva para que el próximo mensaje del
    // cliente vuelva a intentarlo en vez de quedar 12h sin aviso.
    await run('UPDATE conversations SET away_sent_at = $1 WHERE tenant_id = $2 AND phone = $3', [
      conversation.away_sent_at ?? null,
      tenantId,
      conversation.phone,
    ])
    console.error('[ausencia] no se pudo enviar el aviso de fuera de horario:', err)
    return null
  }
}

export async function addNote(tenantId, phone, text) {
  const open = await getOpenDay(tenantId)
  if (!open) throw new Error('No hay un día abierto')
  const conversation = await getConversation(tenantId, phone)
  if (!conversation) throw new Error(`Conversación desconocida: ${phone}`)

  return insertMessage(tenantId, {
    id: `nota-${crypto.randomUUID()}`,
    phone,
    customer: conversation.customer,
    text,
    direction: 'nota',
    type: null,
    status: null,
    author: 'admin',
    externalId: null,
    dayId: open.id,
    createdAt: new Date().toISOString(),
  })
}

export async function setAssignee(tenantId, phone, assignee) {
  await run('UPDATE conversations SET assignee = $1, updated_at = $2 WHERE tenant_id = $3 AND phone = $4', [
    assignee,
    new Date().toISOString(),
    tenantId,
    phone,
  ])
  return getConversation(tenantId, phone)
}

// Etiquetas libres: se normalizan en minúscula y sin espacios de más para que
// "Mayorista" y "mayorista " no convivan como dos etiquetas distintas.
function normalizeTag(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export async function addConversationTag(tenantId, phone, tag) {
  const clean = normalizeTag(tag)
  if (!clean) return null
  if (!(await getConversation(tenantId, phone))) return null

  // La clave (tenant_id, phone, tag) ya impide duplicados; el DO NOTHING evita
  // que etiquetar dos veces lo mismo explote.
  await run(
    `INSERT INTO conversation_tags (tenant_id, phone, tag, created_at) VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, phone, tag) DO NOTHING`,
    [tenantId, phone, clean, new Date().toISOString()],
  )
  return getConversationTags(tenantId, phone)
}

export async function removeConversationTag(tenantId, phone, tag) {
  await run('DELETE FROM conversation_tags WHERE tenant_id = $1 AND phone = $2 AND tag = $3', [
    tenantId,
    phone,
    normalizeTag(tag),
  ])
  return getConversationTags(tenantId, phone)
}

export async function getConversationTags(tenantId, phone) {
  const rows = await many(
    'SELECT tag FROM conversation_tags WHERE tenant_id = $1 AND phone = $2 ORDER BY created_at ASC',
    [tenantId, phone],
  )
  return rows.map((r) => r.tag)
}

// Per-phone agent/assignee, for groupMessagesByPhone on the frontend — it used
// to read this from the static mockData.contactMeta, now it's real
// per-conversation state.
//
// La columna `lifecycle` sigue existiendo en la tabla pero ya no se sirve: nada
// la escribía nunca, así que toda conversación quedaba en 'nuevo' para siempre
// y la etapa que mostraba la dashboard no significaba nada.
export async function getConversationsMeta(tenantId) {
  const rows = await many(
    'SELECT phone, agent, assignee FROM conversations WHERE tenant_id = $1',
    [tenantId],
  )

  // Las etiquetas se traen de una sola consulta y se agrupan en memoria: con
  // una por conversación esto sería N+1 contra la base para nada.
  const tagsByPhone = new Map()
  const tags = await many(
    'SELECT phone, tag FROM conversation_tags WHERE tenant_id = $1 ORDER BY created_at ASC',
    [tenantId],
  )
  for (const { phone, tag } of tags) {
    if (!tagsByPhone.has(phone)) tagsByPhone.set(phone, [])
    tagsByPhone.get(phone).push(tag)
  }

  return Object.fromEntries(
    rows.map(({ phone, ...meta }) => [phone, { ...meta, tags: tagsByPhone.get(phone) ?? [] }]),
  )
}

// Reasignación manual desde la ficha del contacto: pisa lo que haya decidido el
// ruteador para los próximos mensajes de esa conversación.
export async function setConversationAgent(tenantId, phone, agentKey) {
  const agent = await getAgentByKey(tenantId, agentKey)
  if (!agent) return null
  await run('UPDATE conversations SET agent = $1, updated_at = $2 WHERE tenant_id = $3 AND phone = $4', [
    agent.key,
    new Date().toISOString(),
    tenantId,
    phone,
  ])
  return getConversation(tenantId, phone)
}

export async function getOpenDrafts(tenantId) {
  const open = await getOpenDay(tenantId)
  if (!open) return {}
  const rows = await many(
    `SELECT phone, ai_draft AS text, ai_draft_created_at AS "createdAt", ai_draft_category AS category
     FROM conversations WHERE tenant_id = $1 AND ai_draft IS NOT NULL`,
    [tenantId],
  )
  return Object.fromEntries(rows.map(({ phone, ...draft }) => [phone, draft]))
}

export async function discardDraft(tenantId, phone) {
  await clearDraft(tenantId, phone)
}

// Central pipeline: an incoming message, wherever it comes from (real Meta
// webhook or the /dev/simulate-incoming shortcut), goes through the exact
// same classify -> auto-send-or-draft flow.
export async function handleIncomingMessage(tenantId, { phone, channel = 'whatsapp', text, customerName, externalId }) {
  const dayId = await mostRecentDayId(tenantId)
  if (!dayId) throw new Error('No hay ningún día registrado todavía')

  const conversation = await ensureConversation(tenantId, phone, { channel, customer: customerName || phone })

  const now = new Date().toISOString()
  const incoming = await insertMessage(tenantId, {
    id: `in-${crypto.randomUUID()}`,
    phone,
    customer: conversation.customer,
    text,
    direction: 'in',
    type: null,
    status: 'pendiente',
    author: null,
    externalId: externalId ?? null,
    dayId,
    createdAt: now,
  })

  // Este entrante reabre la ventana de servicio de 24h de WhatsApp. Se guarda
  // siempre, incluso si después falla todo lo demás: es lo que decide si más
  // tarde se puede contestar con texto libre o hace falta una plantilla.
  await run('UPDATE conversations SET last_inbound_at = $1, updated_at = $1 WHERE tenant_id = $2 AND phone = $3', [
    now,
    tenantId,
    phone,
  ])

  const settings = await getSettings(tenantId)

  // Si está cerrado avisamos enseguida, antes de que la IA redacte: el cliente
  // recibe la respuesta al toque. La clasificación sigue igual, así el borrador
  // queda listo para cuando abran.
  const dentroDeHorario = isWithinBusinessHours(settings)
  const away = dentroDeHorario ? null : await sendAwayMessage(tenantId, conversation, settings)

  const products = await getProducts(tenantId)
  const history = await many(
    `SELECT text, direction FROM messages
     WHERE tenant_id = $1 AND phone = $2 AND direction IN ('in', 'out') AND id != $3
     ORDER BY created_at ASC`,
    [tenantId, phone, incoming.id],
  )

  const agents = await getEnabledAgents(tenantId)
  if (agents.length === 0) {
    console.error('[ai] no hay agentes habilitados, el mensaje queda pendiente')
    await run(`UPDATE messages SET type = 'pendiente' WHERE tenant_id = $1 AND id = $2`, [tenantId, incoming.id])
    return { incoming, outgoing: null, classification: null, away }
  }

  const currentAgent = agents.find((a) => a.key === conversation.agent) ?? null

  // Elegir agente y redactar van en la misma llamada: el modelo decide quién
  // atiende y escribe con esa voz de una. Antes eran dos viajes secuenciales
  // (la redacción necesitaba saber el agente para armar su prompt), o sea el
  // doble de cuota y el doble de espera para el cliente.
  let classification
  try {
    classification = await classifyAndDraft({ settings, products, agents, currentAgent, history, text })
  } catch (err) {
    console.error('[ai] classifyAndDraft failed, leaving message as pendiente:', err)
    // Sin clasificación tampoco hay agente elegido: dejamos el que ya venía
    // atendiendo para que la conversación no quede sin dueño en la bandeja.
    const fallback = currentAgent ?? agents[0]
    await run(`UPDATE messages SET type = 'pendiente', agent_key = $1 WHERE tenant_id = $2 AND id = $3`, [
      fallback.key,
      tenantId,
      incoming.id,
    ])
    return { incoming: { ...incoming, agentKey: fallback.key }, outgoing: null, classification: null, away }
  }

  const { agent, category, canAutoSend, reply } = classification

  await run('UPDATE conversations SET agent = $1, updated_at = $2 WHERE tenant_id = $3 AND phone = $4', [
    agent.key,
    new Date().toISOString(),
    tenantId,
    phone,
  ])
  await run('UPDATE messages SET agent_key = $1, type = $2 WHERE tenant_id = $3 AND id = $4', [
    agent.key,
    category,
    tenantId,
    incoming.id,
  ])

  // Fuera de horario nunca se auto-envía, por más seguro que se haya sentido el
  // modelo: ya se mandó el aviso de ausencia y la respuesta real queda como
  // borrador para que el equipo la mande cuando abra.
  const open = await getOpenDay(tenantId)
  if (category === 'automatico' && canAutoSend && open && dentroDeHorario) {
    try {
      const outgoing = await sendOutboundMessage(tenantId, phone, reply, 'bot', agent.key)
      await run(`UPDATE messages SET status = 'resuelto' WHERE tenant_id = $1 AND id = $2`, [tenantId, incoming.id])
      return {
        incoming: { ...incoming, type: category, status: 'resuelto', agentKey: agent.key },
        outgoing,
        classification,
        agent,
        away,
      }
    } catch (err) {
      // Se cayó el envío (red, cuota de Meta, número fuera de la allow list).
      // La respuesta ya estaba redactada y costó una llamada al modelo: en vez
      // de descartarla, sigue de largo al guardado de borrador de abajo y
      // queda en la bandeja para mandarla a mano. El mensaje entrante se
      // mantiene pendiente, así nadie cree que ya se contestó.
      console.error('[ai] el auto-envío falló, la respuesta queda como borrador:', err)
    }
  }

  const ahora = new Date().toISOString()
  await run(
    `UPDATE conversations SET ai_draft = $1, ai_draft_created_at = $2, ai_draft_category = $3, updated_at = $2
     WHERE tenant_id = $4 AND phone = $5`,
    [reply, ahora, category, tenantId, phone],
  )

  return { incoming: { ...incoming, type: category, agentKey: agent.key }, outgoing: null, classification, agent, away }
}
