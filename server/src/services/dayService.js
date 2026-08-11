import db from '../db/index.js'

const MESSAGE_COLUMNS = `
  id, customer, phone, text, direction, type, status, author,
  agent_key AS agentKey, created_at AS createdAt
`

export function getOpenDay() {
  return db.prepare("SELECT id, status, opened_at AS openedAt FROM days WHERE status = 'open' LIMIT 1").get()
}

// Boots the server into a valid state: if this is the very first run (no
// days at all), open one automatically so the inbox isn't stuck on
// "cerrado" before anyone has touched /days/open.
export function ensureInitialDay() {
  const any = db.prepare('SELECT id FROM days LIMIT 1').get()
  if (!any) openDay()
}

export function openDay() {
  const existing = getOpenDay()
  if (existing) return existing

  const openedAt = new Date().toISOString()
  const id = `day-${openedAt}`
  db.prepare('INSERT INTO days (id, status, opened_at, closed_at) VALUES (?, ?, ?, NULL)').run(
    id,
    'open',
    openedAt,
  )
  return { id, status: 'open', openedAt }
}

export function closeDay() {
  const open = getOpenDay()
  if (!open) return null

  const closedAt = new Date().toISOString()
  db.prepare("UPDATE days SET status = 'closed', closed_at = ? WHERE id = ?").run(closedAt, open.id)
  return { id: open.id, status: 'closed', openedAt: open.openedAt, closedAt }
}

export function getCurrentDayState() {
  const open = getOpenDay()
  if (open) return { status: 'open', openedAt: open.openedAt, closedAt: null, dayId: open.id }

  const lastClosed = db
    .prepare("SELECT id, opened_at AS openedAt, closed_at AS closedAt FROM days WHERE status = 'closed' ORDER BY closed_at DESC LIMIT 1")
    .get()
  if (!lastClosed) return { status: 'closed', openedAt: null, closedAt: null, dayId: null }
  return { status: 'closed', openedAt: lastClosed.openedAt, closedAt: lastClosed.closedAt, dayId: lastClosed.id }
}

export function getMessagesForDay(dayId) {
  return db
    .prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE day_id = ? ORDER BY created_at ASC`)
    .all(dayId)
}

export function getOpenMessages() {
  const open = getOpenDay()
  if (!open) return []
  return getMessagesForDay(open.id)
}

export function listClosedDays() {
  const days = db
    .prepare("SELECT id, opened_at AS openedAt, closed_at AS closedAt FROM days WHERE status = 'closed' ORDER BY closed_at DESC")
    .all()
  return days.map((d) => ({ ...d, messages: getMessagesForDay(d.id) }))
}
