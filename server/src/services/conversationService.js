import crypto from 'node:crypto'
import db from '../db/index.js'
import { getOpenDay } from './dayService.js'
import { classifyAndDraft } from './ai/classifyAndDraft.js'
import { getSettings } from './settingsService.js'
import { getProducts } from './productsService.js'
import { getEnabledAgents, getAgentByKey } from './agentsService.js'
import { resolveAdapter } from './channels/index.js'
import { isWithinBusinessHours } from './businessHours.js'
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
export function updateDeliveryStatus(externalId, status, error = null) {
  if (!externalId || !DELIVERY_RANK[status]) return null

  const row = db
    .prepare('SELECT id, delivery_status AS actual FROM messages WHERE external_id = ?')
    .get(externalId)
  if (!row) return null // no es nuestro, o es un mensaje anterior a esta tabla

  const rankActual = DELIVERY_RANK[row.actual] ?? 0
  if (DELIVERY_RANK[status] < rankActual) return null

  db.prepare('UPDATE messages SET delivery_status = ?, delivery_error = ? WHERE id = ?').run(
    status,
    error,
    row.id,
  )
  return row.id
}

function mostRecentDayId() {
  const open = getOpenDay()
  if (open) return open.id
  const row = db.prepare('SELECT id FROM days ORDER BY opened_at DESC LIMIT 1').get()
  return row?.id ?? null
}

export function getConversation(phone) {
  return db.prepare('SELECT * FROM conversations WHERE phone = ?').get(phone)
}

export function ensureConversation(phone, { channel = 'whatsapp', customer }) {
  const existing = getConversation(phone)
  if (existing) return existing

  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO conversations (phone, channel, customer, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(phone, channel, customer, now, now)
  return getConversation(phone)
}

function insertMessage(row) {
  db.prepare(
    `INSERT INTO messages (id, phone, customer, text, direction, type, status, author, agent_key, external_id, day_id, created_at)
     VALUES (@id, @phone, @customer, @text, @direction, @type, @status, @author, @agentKey, @externalId, @dayId, @createdAt)`,
  ).run({ agentKey: null, ...row })
  return db.prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE id = ?`).get(row.id)
}

export function resolveConversation(phone) {
  const open = getOpenDay()
  if (!open) return getOpenMessagesForPhone(phone)

  db.prepare(
    `UPDATE messages SET status = 'resuelto'
     WHERE phone = ? AND direction = 'in' AND status = 'pendiente' AND day_id = ?`,
  ).run(phone, open.id)
  return getOpenMessagesForPhone(phone)
}

function getOpenMessagesForPhone(phone) {
  const open = getOpenDay()
  if (!open) return []
  return db
    .prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE day_id = ? AND phone = ? ORDER BY created_at ASC`)
    .all(open.id, phone)
}

function clearDraft(phone) {
  db.prepare(
    "UPDATE conversations SET ai_draft = NULL, ai_draft_created_at = NULL, ai_draft_category = NULL, updated_at = ? WHERE phone = ?",
  ).run(new Date().toISOString(), phone)
}

// Used both for the admin typing a reply by hand and for the AI auto-sending
// one: same channel adapter, same bookkeeping, only `author` differs.
export async function sendOutboundMessage(phone, text, author, agentKey = null) {
  const open = getOpenDay()
  if (!open) throw new Error('No hay un día abierto')

  const conversation = getConversation(phone)
  if (!conversation) throw new Error(`Conversación desconocida: ${phone}`)

  const adapter = resolveAdapter(conversation.channel)
  const { externalId } = await adapter.sendMessage({ phone, channel: conversation.channel }, text)

  const message = insertMessage({
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

  clearDraft(phone)
  db.prepare('UPDATE conversations SET updated_at = ? WHERE phone = ?').run(new Date().toISOString(), phone)
  return message
}

// Aviso de fuera de horario. No pasa por sendOutboundMessage a propósito: ese
// exige un día abierto, y justamente si estamos cerrados lo más probable es que
// no lo haya. Un fallo acá no puede tumbar el procesamiento del entrante, así
// que devuelve null en vez de propagar.
async function sendAwayMessage(conversation, settings) {
  const text = settings?.awayMessage?.trim()
  if (!text) return null

  const dayId = mostRecentDayId()
  if (!dayId) return null

  // Reserva del aviso en una sola sentencia: si dos mensajes del mismo contacto
  // entran a la vez, solo uno consigue el UPDATE y el otro sale con changes=0.
  // Chequear y después escribir por separado dejaba pasar los dos.
  const now = new Date().toISOString()
  const limite = new Date(Date.now() - AWAY_COOLDOWN_MS).toISOString()
  const reserva = db
    .prepare(
      `UPDATE conversations SET away_sent_at = ?, updated_at = ?
       WHERE phone = ? AND (away_sent_at IS NULL OR away_sent_at < ?)`,
    )
    .run(now, now, conversation.phone, limite)

  if (reserva.changes === 0) return null

  try {
    const adapter = resolveAdapter(conversation.channel)
    const { externalId } = await adapter.sendMessage(
      { phone: conversation.phone, channel: conversation.channel },
      text,
    )

    const message = insertMessage({
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

    return message
  } catch (err) {
    // El envío falló: devolvemos la reserva para que el próximo mensaje del
    // cliente vuelva a intentarlo en vez de quedar 12h sin aviso.
    db.prepare('UPDATE conversations SET away_sent_at = ? WHERE phone = ?').run(
      conversation.away_sent_at ?? null,
      conversation.phone,
    )
    console.error('[ausencia] no se pudo enviar el aviso de fuera de horario:', err)
    return null
  }
}

export function addNote(phone, text) {
  const open = getOpenDay()
  if (!open) throw new Error('No hay un día abierto')
  const conversation = getConversation(phone)
  if (!conversation) throw new Error(`Conversación desconocida: ${phone}`)

  return insertMessage({
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

export function setAssignee(phone, assignee) {
  db.prepare('UPDATE conversations SET assignee = ?, updated_at = ? WHERE phone = ?').run(
    assignee,
    new Date().toISOString(),
    phone,
  )
  return getConversation(phone)
}

// Etiquetas libres: se normalizan en minúscula y sin espacios de más para que
// "Mayorista" y "mayorista " no convivan como dos etiquetas distintas.
function normalizeTag(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function addConversationTag(phone, tag) {
  const clean = normalizeTag(tag)
  if (!clean) return null
  if (!getConversation(phone)) return null

  // El PRIMARY KEY (phone, tag) ya impide duplicados; el OR IGNORE evita que
  // etiquetar dos veces lo mismo explote.
  db.prepare('INSERT OR IGNORE INTO conversation_tags (phone, tag, created_at) VALUES (?, ?, ?)').run(
    phone,
    clean,
    new Date().toISOString(),
  )
  return getConversationTags(phone)
}

export function removeConversationTag(phone, tag) {
  db.prepare('DELETE FROM conversation_tags WHERE phone = ? AND tag = ?').run(phone, normalizeTag(tag))
  return getConversationTags(phone)
}

export function getConversationTags(phone) {
  return db
    .prepare('SELECT tag FROM conversation_tags WHERE phone = ? ORDER BY created_at ASC')
    .all(phone)
    .map((r) => r.tag)
}

// Per-phone lifecycle/agent/assignee, for groupMessagesByPhone on the
// frontend — it used to read this from the static mockData.contactMeta,
// now it's real per-conversation state.
export function getConversationsMeta() {
  const rows = db.prepare('SELECT phone, lifecycle, agent, assignee FROM conversations').all()

  // Las etiquetas se traen de una sola consulta y se agrupan en memoria: con
  // una por conversación esto sería N+1 contra la base para nada.
  const tagsByPhone = new Map()
  for (const { phone, tag } of db
    .prepare('SELECT phone, tag FROM conversation_tags ORDER BY created_at ASC')
    .all()) {
    if (!tagsByPhone.has(phone)) tagsByPhone.set(phone, [])
    tagsByPhone.get(phone).push(tag)
  }

  return Object.fromEntries(
    rows.map(({ phone, ...meta }) => [phone, { ...meta, tags: tagsByPhone.get(phone) ?? [] }]),
  )
}

// Reasignación manual desde la ficha del contacto: pisa lo que haya decidido el
// ruteador para los próximos mensajes de esa conversación.
export function setConversationAgent(phone, agentKey) {
  const agent = getAgentByKey(agentKey)
  if (!agent) return null
  db.prepare('UPDATE conversations SET agent = ?, updated_at = ? WHERE phone = ?').run(
    agent.key,
    new Date().toISOString(),
    phone,
  )
  return getConversation(phone)
}

export function getOpenDrafts() {
  const open = getOpenDay()
  if (!open) return {}
  const rows = db
    .prepare(
      `SELECT phone, ai_draft AS text, ai_draft_created_at AS createdAt, ai_draft_category AS category
       FROM conversations WHERE ai_draft IS NOT NULL`,
    )
    .all()
  return Object.fromEntries(rows.map(({ phone, ...draft }) => [phone, draft]))
}

export function discardDraft(phone) {
  clearDraft(phone)
}

// Central pipeline: an incoming message, wherever it comes from (real Meta
// webhook or the /dev/simulate-incoming shortcut), goes through the exact
// same classify -> auto-send-or-draft flow.
export async function handleIncomingMessage({ phone, channel = 'whatsapp', text, customerName, externalId }) {
  const dayId = mostRecentDayId()
  if (!dayId) throw new Error('No hay ningún día registrado todavía')

  const conversation = ensureConversation(phone, { channel, customer: customerName || phone })

  const incoming = insertMessage({
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
    createdAt: new Date().toISOString(),
  })

  const settings = getSettings()

  // Si está cerrado avisamos enseguida, antes de que la IA redacte: el cliente
  // recibe la respuesta al toque. La clasificación sigue igual, así el borrador
  // queda listo para cuando abran.
  const dentroDeHorario = isWithinBusinessHours(settings)
  const away = dentroDeHorario ? null : await sendAwayMessage(conversation, settings)

  const products = getProducts()
  const history = db
    .prepare(
      `SELECT text, direction FROM messages
       WHERE phone = ? AND direction IN ('in', 'out') AND id != ?
       ORDER BY created_at ASC`,
    )
    .all(phone, incoming.id)

  const agents = getEnabledAgents()
  if (agents.length === 0) {
    console.error('[ai] no hay agentes habilitados, el mensaje queda pendiente')
    db.prepare("UPDATE messages SET type = 'pendiente' WHERE id = ?").run(incoming.id)
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
    db.prepare("UPDATE messages SET type = 'pendiente' WHERE id = ?").run(incoming.id)
    // Sin clasificación tampoco hay agente elegido: dejamos el que ya venía
    // atendiendo para que la conversación no quede sin dueño en la bandeja.
    const fallback = currentAgent ?? agents[0]
    db.prepare('UPDATE messages SET agent_key = ? WHERE id = ?').run(fallback.key, incoming.id)
    return { incoming: { ...incoming, agentKey: fallback.key }, outgoing: null, classification: null, away }
  }

  const { agent, category, canAutoSend, reply } = classification

  db.prepare('UPDATE conversations SET agent = ?, updated_at = ? WHERE phone = ?').run(
    agent.key,
    new Date().toISOString(),
    phone,
  )
  db.prepare('UPDATE messages SET agent_key = ? WHERE id = ?').run(agent.key, incoming.id)
  db.prepare('UPDATE messages SET type = ? WHERE id = ?').run(category, incoming.id)

  // Fuera de horario nunca se auto-envía, por más seguro que se haya sentido el
  // modelo: ya se mandó el aviso de ausencia y la respuesta real queda como
  // borrador para que el equipo la mande cuando abra.
  const open = getOpenDay()
  if (category === 'automatico' && canAutoSend && open && dentroDeHorario) {
    try {
      const outgoing = await sendOutboundMessage(phone, reply, 'bot', agent.key)
      db.prepare("UPDATE messages SET status = 'resuelto' WHERE id = ?").run(incoming.id)
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

  db.prepare(
    'UPDATE conversations SET ai_draft = ?, ai_draft_created_at = ?, ai_draft_category = ?, updated_at = ? WHERE phone = ?',
  ).run(reply, new Date().toISOString(), category, new Date().toISOString(), phone)

  return { incoming: { ...incoming, type: category, agentKey: agent.key }, outgoing: null, classification, agent, away }
}
