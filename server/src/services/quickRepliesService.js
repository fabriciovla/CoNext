import crypto from 'node:crypto'
import db from '../db/index.js'

const COLUMNS = 'id, shortcut, text, position, created_at AS createdAt, updated_at AS updatedAt'

// El atajo se guarda normalizado (sin barra, sin espacios, minúsculas) para que
// "/Envíos " y "envios" sean el mismo y el UNIQUE sirva de algo.
function normalizeShortcut(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

export function getQuickReplies() {
  return db.prepare(`SELECT ${COLUMNS} FROM quick_replies ORDER BY position ASC, rowid ASC`).all()
}

export function addQuickReply({ shortcut, text }) {
  const cleanShortcut = normalizeShortcut(shortcut)
  const cleanText = String(text ?? '').trim()
  if (!cleanShortcut || !cleanText) return null

  const exists = db.prepare('SELECT id FROM quick_replies WHERE shortcut = ?').get(cleanShortcut)
  if (exists) return updateQuickReply(exists.id, { text: cleanText })

  const id = `qr-${crypto.randomUUID()}`
  const now = new Date().toISOString()
  const { position } = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS position FROM quick_replies').get()

  db.prepare(
    `INSERT INTO quick_replies (id, shortcut, text, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, cleanShortcut, cleanText, position, now, now)

  return db.prepare(`SELECT ${COLUMNS} FROM quick_replies WHERE id = ?`).get(id)
}

export function updateQuickReply(id, changes) {
  const current = db.prepare(`SELECT ${COLUMNS} FROM quick_replies WHERE id = ?`).get(id)
  if (!current) return null

  const shortcut = changes.shortcut === undefined ? current.shortcut : normalizeShortcut(changes.shortcut)
  const text = changes.text === undefined ? current.text : String(changes.text).trim()
  if (!shortcut || !text) return null

  db.prepare('UPDATE quick_replies SET shortcut = ?, text = ?, updated_at = ? WHERE id = ?').run(
    shortcut,
    text,
    new Date().toISOString(),
    id,
  )
  return db.prepare(`SELECT ${COLUMNS} FROM quick_replies WHERE id = ?`).get(id)
}

export function deleteQuickReply(id) {
  db.prepare('DELETE FROM quick_replies WHERE id = ?').run(id)
}
