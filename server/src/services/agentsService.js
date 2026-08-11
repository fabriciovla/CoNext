import crypto from 'node:crypto'
import db from '../db/index.js'

const COLUMNS = `
  id, key, name, emoji, role, instructions, enabled, auto_send AS autoSend,
  position, created_at AS createdAt, updated_at AS updatedAt
`

// SQLite no tiene booleanos: se guardan como 0/1 y se devuelven como tales.
// El frontend y el pipeline de IA trabajan con booleanos, así que la
// traducción se hace acá y en un solo lugar.
function mapRow(row) {
  if (!row) return null
  return { ...row, enabled: Boolean(row.enabled), autoSend: Boolean(row.autoSend) }
}

function slugify(name) {
  return (
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'agente'
  )
}

// La `key` es lo que queda escrito en cada conversación y en cada mensaje, así
// que se genera una vez y no cambia aunque después le renombren el agente.
function uniqueKey(name) {
  const base = slugify(name)
  const taken = new Set(db.prepare('SELECT key FROM agents').all().map((r) => r.key))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function getAgents() {
  return db.prepare(`SELECT ${COLUMNS} FROM agents ORDER BY position ASC, rowid ASC`).all().map(mapRow)
}

export function getAgent(id) {
  return mapRow(db.prepare(`SELECT ${COLUMNS} FROM agents WHERE id = ?`).get(id))
}

export function getAgentByKey(key) {
  return mapRow(db.prepare(`SELECT ${COLUMNS} FROM agents WHERE key = ?`).get(key))
}

export function getEnabledAgents() {
  return db
    .prepare(`SELECT ${COLUMNS} FROM agents WHERE enabled = 1 ORDER BY position ASC, rowid ASC`)
    .all()
    .map(mapRow)
}

// Adónde cae una conversación cuando el agente que la atendía se apagó o se
// borró: el primero habilitado por orden.
export function getFallbackAgent() {
  return getEnabledAgents()[0] ?? null
}

export function addAgent({ name, emoji, role, instructions, enabled, autoSend }) {
  const now = new Date().toISOString()
  const nextPosition =
    (db.prepare('SELECT MAX(position) AS max FROM agents').get()?.max ?? -1) + 1

  const id = `agent-${crypto.randomUUID()}`
  db.prepare(
    `INSERT INTO agents (id, key, name, emoji, role, instructions, enabled, auto_send, position, created_at, updated_at)
     VALUES (@id, @key, @name, @emoji, @role, @instructions, @enabled, @autoSend, @position, @createdAt, @updatedAt)`,
  ).run({
    id,
    key: uniqueKey(name),
    name,
    emoji: emoji || '🤖',
    role: role ?? '',
    instructions: instructions ?? '',
    enabled: enabled === false ? 0 : 1,
    autoSend: autoSend === false ? 0 : 1,
    position: nextPosition,
    createdAt: now,
    updatedAt: now,
  })

  return getAgent(id)
}

export function updateAgent(id, changes) {
  const current = getAgent(id)
  if (!current) return null

  // `key` no se toca nunca: es la referencia que ya quedó escrita en las
  // conversaciones y en los mensajes atendidos.
  const next = { ...current, ...changes, key: current.key }
  db.prepare(
    `UPDATE agents SET name = @name, emoji = @emoji, role = @role, instructions = @instructions,
       enabled = @enabled, auto_send = @autoSend, position = @position, updated_at = @updatedAt
     WHERE id = @id`,
  ).run({
    id,
    name: next.name,
    emoji: next.emoji || '🤖',
    role: next.role ?? '',
    instructions: next.instructions ?? '',
    enabled: next.enabled ? 1 : 0,
    autoSend: next.autoSend ? 1 : 0,
    position: next.position,
    updatedAt: new Date().toISOString(),
  })

  return getAgent(id)
}

// Borrar un agente no puede dejar conversaciones apuntando a una key que ya no
// existe (la bandeja las filtra por agente), así que se reasignan al fallback.
// El historial de mensajes sí conserva la key original: es lo que pasó.
export function deleteAgent(id) {
  const agent = getAgent(id)
  if (!agent) return { deleted: false, reason: 'not-found' }
  if (db.prepare('SELECT COUNT(*) AS n FROM agents').get().n <= 1) {
    return { deleted: false, reason: 'last-agent' }
  }

  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM agents WHERE id = ?').run(id)
    const fallback = getFallbackAgent()
    if (fallback) {
      db.prepare('UPDATE conversations SET agent = ?, updated_at = ? WHERE agent = ?').run(
        fallback.key,
        new Date().toISOString(),
        agent.key,
      )
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  return { deleted: true }
}

export function reorderAgents(ids) {
  const update = db.prepare('UPDATE agents SET position = ?, updated_at = ? WHERE id = ?')
  const now = new Date().toISOString()
  db.exec('BEGIN')
  try {
    ids.forEach((id, index) => update.run(index, now, id))
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  return getAgents()
}

// Métricas por agente, con `agent_key` de los mensajes entrantes como unidad:
// es lo que el agente efectivamente clasificó. Las conversaciones se cuentan
// aparte porque una conversación la "tiene" un solo agente a la vez.
export function getAgentStats() {
  const conversations = db
    .prepare('SELECT agent AS key, COUNT(*) AS n FROM conversations GROUP BY agent')
    .all()

  const messages = db
    .prepare(
      `SELECT agent_key AS key,
              COUNT(*) AS handled,
              SUM(CASE WHEN type = 'automatico' THEN 1 ELSE 0 END) AS automatic,
              SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) AS pending
       FROM messages
       WHERE direction = 'in' AND agent_key IS NOT NULL
       GROUP BY agent_key`,
    )
    .all()

  const byKey = {}
  const bucket = (key) =>
    (byKey[key] ??= { conversations: 0, handled: 0, automatic: 0, pending: 0 })

  for (const row of conversations) bucket(row.key).conversations = row.n
  for (const row of messages) {
    const stats = bucket(row.key)
    stats.handled = row.handled
    stats.automatic = row.automatic ?? 0
    stats.pending = row.pending ?? 0
  }

  return byKey
}
