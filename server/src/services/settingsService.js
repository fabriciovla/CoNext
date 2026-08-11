import db from '../db/index.js'

function mapRow(row) {
  return {
    storeName: row.store_name,
    whatsappNumber: row.whatsapp_number,
    openTime: row.open_time,
    closeTime: row.close_time,
    daysOpen: JSON.parse(row.days_open),
    welcomeMessage: row.welcome_message,
    awayMessage: row.away_message,
  }
}

export function getSettings() {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get()
  return row ? mapRow(row) : null
}

export function updateSettings(changes) {
  const current = getSettings() ?? {}
  const next = { ...current, ...changes }

  db.prepare(
    `INSERT INTO settings (id, store_name, whatsapp_number, open_time, close_time, days_open, welcome_message, away_message)
     VALUES (1, @storeName, @whatsappNumber, @openTime, @closeTime, @daysOpen, @welcomeMessage, @awayMessage)
     ON CONFLICT(id) DO UPDATE SET
       store_name = excluded.store_name,
       whatsapp_number = excluded.whatsapp_number,
       open_time = excluded.open_time,
       close_time = excluded.close_time,
       days_open = excluded.days_open,
       welcome_message = excluded.welcome_message,
       away_message = excluded.away_message`,
    // awayMessage puede faltar si el cliente manda un settings parcial de antes
    // de que existiera el campo: sin el fallback, SQLite corta por parámetro
    // nombrado ausente.
  ).run({ ...next, daysOpen: JSON.stringify(next.daysOpen), awayMessage: next.awayMessage ?? '' })

  return getSettings()
}
