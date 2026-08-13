import { one, many, run } from '../db/index.js'
import { MESSAGE_COLUMNS } from './messageColumns.js'

// Todas las funciones de acá abajo reciben `tenantId` como primer argumento.
// No hay versión "sin tenant": un día abierto es de un negocio, y mezclarlos
// haría que abrir la caja de un cliente abra la de todos.

export async function getOpenDay(tenantId) {
  return one(
    `SELECT id, status, opened_at AS "openedAt" FROM days WHERE tenant_id = $1 AND status = 'open' LIMIT 1`,
    [tenantId],
  )
}

// Deja al cliente en un estado usable: si es la primera vez (no hay ningún
// día), se abre uno solo, así la bandeja no queda trabada en "cerrado" antes
// de que nadie haya tocado /days/open.
export async function ensureInitialDay(tenantId) {
  const any = await one('SELECT id FROM days WHERE tenant_id = $1 LIMIT 1', [tenantId])
  if (!any) return openDay(tenantId)
  return null
}

export async function openDay(tenantId) {
  const existing = await getOpenDay(tenantId)
  if (existing) return existing

  const openedAt = new Date().toISOString()
  const id = `day-${openedAt}`
  await run(`INSERT INTO days (tenant_id, id, status, opened_at, closed_at) VALUES ($1, $2, 'open', $3, NULL)`, [
    tenantId,
    id,
    openedAt,
  ])
  return { id, status: 'open', openedAt }
}

export async function closeDay(tenantId) {
  const open = await getOpenDay(tenantId)
  if (!open) return null

  const closedAt = new Date().toISOString()
  await run(`UPDATE days SET status = 'closed', closed_at = $1 WHERE tenant_id = $2 AND id = $3`, [
    closedAt,
    tenantId,
    open.id,
  ])
  return { id: open.id, status: 'closed', openedAt: open.openedAt, closedAt }
}

export async function getCurrentDayState(tenantId) {
  const open = await getOpenDay(tenantId)
  if (open) return { status: 'open', openedAt: open.openedAt, closedAt: null, dayId: open.id }

  const lastClosed = await one(
    `SELECT id, opened_at AS "openedAt", closed_at AS "closedAt"
     FROM days WHERE tenant_id = $1 AND status = 'closed' ORDER BY closed_at DESC LIMIT 1`,
    [tenantId],
  )
  if (!lastClosed) return { status: 'closed', openedAt: null, closedAt: null, dayId: null }
  return { status: 'closed', openedAt: lastClosed.openedAt, closedAt: lastClosed.closedAt, dayId: lastClosed.id }
}

export async function getMessagesForDay(tenantId, dayId) {
  return many(
    `SELECT ${MESSAGE_COLUMNS} FROM messages WHERE tenant_id = $1 AND day_id = $2 ORDER BY created_at ASC`,
    [tenantId, dayId],
  )
}

export async function getOpenMessages(tenantId) {
  const open = await getOpenDay(tenantId)
  if (!open) return []
  return getMessagesForDay(tenantId, open.id)
}

export async function listClosedDays(tenantId) {
  const days = await many(
    `SELECT id, opened_at AS "openedAt", closed_at AS "closedAt"
     FROM days WHERE tenant_id = $1 AND status = 'closed' ORDER BY closed_at DESC`,
    [tenantId],
  )

  // Los mensajes de todos los días cerrados salen en una sola consulta y se
  // agrupan en memoria. Antes era una consulta por día: con un cliente de
  // varios meses de historial eso es N+1 contra la base cada vez que alguien
  // abre el historial.
  if (days.length === 0) return []

  const mensajes = await many(
    `SELECT ${MESSAGE_COLUMNS}, day_id AS "dayId" FROM messages
     WHERE tenant_id = $1 AND day_id = ANY($2) ORDER BY created_at ASC`,
    [tenantId, days.map((d) => d.id)],
  )

  const porDia = new Map()
  for (const { dayId, ...m } of mensajes) {
    if (!porDia.has(dayId)) porDia.set(dayId, [])
    porDia.get(dayId).push(m)
  }

  return days.map((d) => ({ ...d, messages: porDia.get(d.id) ?? [] }))
}
