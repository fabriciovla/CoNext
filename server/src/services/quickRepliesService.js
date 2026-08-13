import crypto from 'node:crypto'
import { one, many, run } from '../db/index.js'

const COLUMNS = 'id, shortcut, text, position, created_at AS "createdAt", updated_at AS "updatedAt"'

// El atajo se guarda normalizado (sin barra, sin espacios, minúsculas) para que
// "/Envíos " y "envios" sean el mismo y el UNIQUE sirva de algo.
function normalizeShortcut(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

export async function getQuickReplies(tenantId) {
  return many(
    `SELECT ${COLUMNS} FROM quick_replies WHERE tenant_id = $1 ORDER BY position ASC, created_at ASC`,
    [tenantId],
  )
}

export async function addQuickReply(tenantId, { shortcut, text }) {
  const cleanShortcut = normalizeShortcut(shortcut)
  const cleanText = String(text ?? '').trim()
  if (!cleanShortcut || !cleanText) return null

  const exists = await one('SELECT id FROM quick_replies WHERE tenant_id = $1 AND shortcut = $2', [
    tenantId,
    cleanShortcut,
  ])
  if (exists) return updateQuickReply(tenantId, exists.id, { text: cleanText })

  const id = `qr-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const { position } = await one(
    'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM quick_replies WHERE tenant_id = $1',
    [tenantId],
  )

  await run(
    `INSERT INTO quick_replies (tenant_id, id, shortcut, text, position, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $6)`,
    [tenantId, id, cleanShortcut, cleanText, position, now],
  )

  return one(`SELECT ${COLUMNS} FROM quick_replies WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
}

export async function updateQuickReply(tenantId, id, changes) {
  const current = await one(`SELECT ${COLUMNS} FROM quick_replies WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
  if (!current) return null

  const shortcut = changes.shortcut === undefined ? current.shortcut : normalizeShortcut(changes.shortcut)
  const text = changes.text === undefined ? current.text : String(changes.text).trim()
  if (!shortcut || !text) return null

  await run('UPDATE quick_replies SET shortcut = $1, text = $2, updated_at = $3 WHERE tenant_id = $4 AND id = $5', [
    shortcut,
    text,
    new Date().toISOString(),
    tenantId,
    id,
  ])
  return one(`SELECT ${COLUMNS} FROM quick_replies WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
}

export async function deleteQuickReply(tenantId, id) {
  await run('DELETE FROM quick_replies WHERE tenant_id = $1 AND id = $2', [tenantId, id])
}
