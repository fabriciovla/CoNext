// Loads the example data from src/data/mockData.js into the database, so the
// UI isn't empty on first run. Safe to re-run: skips if products already exist.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import db from '../src/db/index.js'
import { initialMessages, contactMeta, initialProducts, initialSettings } from '../../src/data/mockData.js'

migrate()

const alreadySeeded = db.prepare('SELECT id FROM products LIMIT 1').get()
if (alreadySeeded) {
  console.log('[seed] products already present, skipping')
  process.exit(0)
}

db.prepare(
  `INSERT INTO settings (id, store_name, whatsapp_number, open_time, close_time, days_open, welcome_message)
   VALUES (1, ?, ?, ?, ?, ?, ?)`,
).run(
  initialSettings.storeName,
  initialSettings.whatsappNumber,
  initialSettings.openTime,
  initialSettings.closeTime,
  JSON.stringify(initialSettings.daysOpen),
  initialSettings.welcomeMessage,
)

const insertProduct = db.prepare('INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)')
for (const p of initialProducts) insertProduct.run(p.id, p.name, p.price, p.stock)

const earliest = initialMessages.reduce(
  (min, m) => (m.createdAt < min ? m.createdAt : min),
  initialMessages[0].createdAt,
)
const dayId = `day-${earliest}`
db.prepare('INSERT INTO days (id, status, opened_at, closed_at) VALUES (?, ?, ?, NULL)').run(dayId, 'open', earliest)

const customerByPhone = new Map()
for (const m of initialMessages) {
  if (m.direction === 'in') customerByPhone.set(m.phone, m.customer)
}
for (const m of initialMessages) {
  if (!customerByPhone.has(m.phone)) customerByPhone.set(m.phone, m.customer)
}

const insertConversation = db.prepare(
  `INSERT INTO conversations (phone, channel, customer, lifecycle, agent, assignee, created_at, updated_at)
   VALUES (?, 'whatsapp', ?, ?, ?, ?, ?, ?)`,
)
for (const [phone, customer] of customerByPhone) {
  const meta = contactMeta[phone] ?? {}
  insertConversation.run(
    phone,
    customer,
    meta.lifecycle ?? 'nuevo',
    meta.agent ?? 'recepcion',
    meta.assignee ?? null,
    earliest,
    earliest,
  )
}

const insertMessage = db.prepare(
  `INSERT INTO messages (id, phone, customer, text, direction, type, status, author, external_id, day_id, created_at)
   VALUES (@id, @phone, @customer, @text, @direction, @type, @status, @author, NULL, @dayId, @createdAt)`,
)
for (const m of initialMessages) {
  insertMessage.run({
    id: m.id,
    phone: m.phone,
    customer: m.customer,
    text: m.text,
    direction: m.direction,
    type: m.type ?? null,
    status: m.status ?? null,
    author: m.author ?? null,
    dayId,
    createdAt: m.createdAt,
  })
}

console.log(`[seed] loaded ${initialProducts.length} products, ${customerByPhone.size} conversations, ${initialMessages.length} messages`)
