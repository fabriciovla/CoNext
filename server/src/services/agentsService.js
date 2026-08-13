import crypto from 'node:crypto'
import { one, many, run, tx } from '../db/index.js'

const COLUMNS = `
  id, key, name, emoji, role, instructions, enabled, auto_send AS "autoSend",
  position, created_at AS "createdAt", updated_at AS "updatedAt"
`

// enabled y auto_send se guardan como 0/1 (venían así de SQLite y se mantuvo el
// tipo para no tocar todas las consultas). El frontend y el pipeline de IA
// trabajan con booleanos, así que la traducción se hace acá y en un solo lugar.
function mapRow(row) {
  if (!row) return null
  return { ...row, enabled: Boolean(row.enabled), autoSend: Boolean(row.autoSend) }
}

function slugify(name) {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'agente'
  )
}

// La `key` es lo que queda escrito en cada conversación y en cada mensaje, así
// que se genera una vez y no cambia aunque después le renombren el agente.
// Única dentro del cliente, no del sistema: dos negocios pueden tener cada uno
// su agente 'ventas' sin pisarse.
async function uniqueKey(tenantId, name) {
  const base = slugify(name)
  const taken = new Set((await many('SELECT key FROM agents WHERE tenant_id = $1', [tenantId])).map((r) => r.key))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export async function getAgents(tenantId) {
  const rows = await many(
    `SELECT ${COLUMNS} FROM agents WHERE tenant_id = $1 ORDER BY position ASC, created_at ASC`,
    [tenantId],
  )
  return rows.map(mapRow)
}

export async function getAgent(tenantId, id) {
  return mapRow(await one(`SELECT ${COLUMNS} FROM agents WHERE tenant_id = $1 AND id = $2`, [tenantId, id]))
}

export async function getAgentByKey(tenantId, key) {
  return mapRow(await one(`SELECT ${COLUMNS} FROM agents WHERE tenant_id = $1 AND key = $2`, [tenantId, key]))
}

export async function getEnabledAgents(tenantId) {
  const rows = await many(
    `SELECT ${COLUMNS} FROM agents WHERE tenant_id = $1 AND enabled = 1 ORDER BY position ASC, created_at ASC`,
    [tenantId],
  )
  return rows.map(mapRow)
}

// Adónde cae una conversación cuando el agente que la atendía se apagó o se
// borró: el primero habilitado por orden.
export async function getFallbackAgent(tenantId) {
  return (await getEnabledAgents(tenantId))[0] ?? null
}

export async function addAgent(tenantId, { name, emoji, role, instructions, enabled, autoSend }) {
  const now = new Date().toISOString()
  const { max } = await one('SELECT MAX(position) AS max FROM agents WHERE tenant_id = $1', [tenantId])
  const nextPosition = (max ?? -1) + 1

  const id = `agent-${crypto.randomUUID()}`
  await run(
    `INSERT INTO agents (tenant_id, id, key, name, emoji, role, instructions, enabled, auto_send, position, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
    [
      tenantId,
      id,
      await uniqueKey(tenantId, name),
      name,
      emoji || '🤖',
      role ?? '',
      instructions ?? '',
      enabled === false ? 0 : 1,
      autoSend === false ? 0 : 1,
      nextPosition,
      now,
    ],
  )

  return getAgent(tenantId, id)
}

export async function updateAgent(tenantId, id, changes) {
  const current = await getAgent(tenantId, id)
  if (!current) return null

  // `key` no se toca nunca: es la referencia que ya quedó escrita en las
  // conversaciones y en los mensajes atendidos.
  const next = { ...current, ...changes, key: current.key }
  await run(
    `UPDATE agents SET name = $1, emoji = $2, role = $3, instructions = $4,
       enabled = $5, auto_send = $6, position = $7, updated_at = $8
     WHERE tenant_id = $9 AND id = $10`,
    [
      next.name,
      next.emoji || '🤖',
      next.role ?? '',
      next.instructions ?? '',
      next.enabled ? 1 : 0,
      next.autoSend ? 1 : 0,
      next.position,
      new Date().toISOString(),
      tenantId,
      id,
    ],
  )

  return getAgent(tenantId, id)
}

// Borrar un agente no puede dejar conversaciones apuntando a una key que ya no
// existe (la bandeja las filtra por agente), así que se reasignan al fallback.
// El historial de mensajes sí conserva la key original: es lo que pasó.
export async function deleteAgent(tenantId, id) {
  const agent = await getAgent(tenantId, id)
  if (!agent) return { deleted: false, reason: 'not-found' }

  // COUNT(*) en Postgres vuelve como bigint, que el driver entrega como string:
  // sin el cast, la comparación con <= 1 es contra "3" y nunca frena.
  const { n } = await one('SELECT COUNT(*)::int AS n FROM agents WHERE tenant_id = $1', [tenantId])
  if (n <= 1) return { deleted: false, reason: 'last-agent' }

  await tx(async (client) => {
    await client.query('DELETE FROM agents WHERE tenant_id = $1 AND id = $2', [tenantId, id])

    // El fallback se busca dentro de la transacción y sobre la misma conexión:
    // si se leyera de afuera podría devolver el agente que se acaba de borrar.
    const { rows } = await client.query(
      `SELECT key FROM agents WHERE tenant_id = $1 AND enabled = 1 ORDER BY position ASC, created_at ASC LIMIT 1`,
      [tenantId],
    )
    const fallback = rows[0]
    if (fallback) {
      await client.query(
        'UPDATE conversations SET agent = $1, updated_at = $2 WHERE tenant_id = $3 AND agent = $4',
        [fallback.key, new Date().toISOString(), tenantId, agent.key],
      )
    }
  })

  return { deleted: true }
}

export async function reorderAgents(tenantId, ids) {
  const now = new Date().toISOString()
  await tx(async (client) => {
    for (const [index, id] of ids.entries()) {
      await client.query('UPDATE agents SET position = $1, updated_at = $2 WHERE tenant_id = $3 AND id = $4', [
        index,
        now,
        tenantId,
        id,
      ])
    }
  })
  return getAgents(tenantId)
}

// Métricas por agente, con `agent_key` de los mensajes entrantes como unidad:
// es lo que el agente efectivamente clasificó. Las conversaciones se cuentan
// aparte porque una conversación la "tiene" un solo agente a la vez.
export async function getAgentStats(tenantId) {
  const conversations = await many(
    'SELECT agent AS key, COUNT(*)::int AS n FROM conversations WHERE tenant_id = $1 GROUP BY agent',
    [tenantId],
  )

  const messages = await many(
    `SELECT agent_key AS key,
            COUNT(*)::int AS handled,
            SUM(CASE WHEN type = 'automatico' THEN 1 ELSE 0 END)::int AS automatic,
            SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END)::int AS pending
     FROM messages
     WHERE tenant_id = $1 AND direction = 'in' AND agent_key IS NOT NULL
     GROUP BY agent_key`,
    [tenantId],
  )

  const byKey = {}
  const bucket = (key) => (byKey[key] ??= { conversations: 0, handled: 0, automatic: 0, pending: 0 })

  for (const row of conversations) bucket(row.key).conversations = row.n
  for (const row of messages) {
    const stats = bucket(row.key)
    stats.handled = row.handled
    stats.automatic = row.automatic ?? 0
    stats.pending = row.pending ?? 0
  }

  return byKey
}
