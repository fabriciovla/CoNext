// Carga los datos de ejemplo de src/data/mockData.js dentro de un cliente, para
// que la UI no arranque vacía. Se le pasa el id o el slug del tenant:
//
//   node scripts/seed.js tenant-<uuid>
//   node scripts/seed.js almacen-dona-rosa
//
// Antes no hacía falta el argumento porque había un solo negocio. Ahora sembrar
// "la base" no significa nada: los datos son de alguien.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, run, closePool } from '../src/db/index.js'
import { initialMessages, contactMeta, initialProducts, initialSettings } from '../../src/data/mockData.js'

const ref = process.argv[2]

if (!ref) {
  console.error(
    'Uso: node scripts/seed.js <tenantId|slug>\n' +
      'Creá primero el cliente con: node scripts/createTenant.js "<nombre>"',
  )
  process.exit(1)
}

await migrate()

const tenant = await one('SELECT id, name FROM tenants WHERE id = $1 OR slug = $1', [ref])
if (!tenant) {
  console.error(`No existe ningún cliente con id o slug "${ref}".`)
  await closePool()
  process.exit(1)
}

const tenantId = tenant.id

const alreadySeeded = await one('SELECT id FROM products WHERE tenant_id = $1 LIMIT 1', [tenantId])
if (alreadySeeded) {
  console.log(`[seed] ${tenant.name} ya tiene productos, no se toca nada`)
  await closePool()
  process.exit(0)
}

// provisionTenant ya dejó el renglón de settings; acá se pisa con los valores
// de ejemplo.
await run(
  `UPDATE settings SET store_name = $1, whatsapp_number = $2, open_time = $3, close_time = $4,
     days_open = $5, welcome_message = $6
   WHERE tenant_id = $7`,
  [
    initialSettings.storeName,
    initialSettings.whatsappNumber,
    initialSettings.openTime,
    initialSettings.closeTime,
    JSON.stringify(initialSettings.daysOpen),
    initialSettings.welcomeMessage,
    tenantId,
  ],
)

const now = new Date().toISOString()
for (const p of initialProducts) {
  await run('INSERT INTO products (tenant_id, id, name, price, stock, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [
    tenantId,
    p.id,
    p.name,
    p.price,
    p.stock,
    now,
  ])
}

const earliest = initialMessages.reduce(
  (min, m) => (m.createdAt < min ? m.createdAt : min),
  initialMessages[0].createdAt,
)

// El alta ya abrió un día. Los mensajes de ejemplo son más viejos, así que se
// cuelgan de ese mismo día abierto en vez de crear otro: no puede haber dos
// abiertos a la vez (lo impide un índice único).
const open = await one(`SELECT id FROM days WHERE tenant_id = $1 AND status = 'open' LIMIT 1`, [tenantId])
let dayId = open?.id
if (!dayId) {
  dayId = `day-${earliest}`
  await run(`INSERT INTO days (tenant_id, id, status, opened_at, closed_at) VALUES ($1, $2, 'open', $3, NULL)`, [
    tenantId,
    dayId,
    earliest,
  ])
}

const customerByPhone = new Map()
for (const m of initialMessages) {
  if (m.direction === 'in') customerByPhone.set(m.phone, m.customer)
}
for (const m of initialMessages) {
  if (!customerByPhone.has(m.phone)) customerByPhone.set(m.phone, m.customer)
}

for (const [phone, customer] of customerByPhone) {
  const meta = contactMeta[phone] ?? {}
  await run(
    `INSERT INTO conversations (tenant_id, phone, channel, customer, lifecycle, agent, assignee, created_at, updated_at)
     VALUES ($1, $2, 'whatsapp', $3, $4, $5, $6, $7, $7)`,
    [tenantId, phone, customer, meta.lifecycle ?? 'nuevo', meta.agent ?? 'recepcion', meta.assignee ?? null, earliest],
  )
}

for (const m of initialMessages) {
  await run(
    `INSERT INTO messages (tenant_id, id, phone, customer, text, direction, type, status, author, external_id, day_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, $10, $11)`,
    [
      tenantId,
      m.id,
      m.phone,
      m.customer,
      m.text,
      m.direction,
      m.type ?? null,
      m.status ?? null,
      m.author ?? null,
      dayId,
      m.createdAt,
    ],
  )
}

console.log(
  `[seed] ${tenant.name}: ${initialProducts.length} productos, ${customerByPhone.size} conversaciones, ${initialMessages.length} mensajes`,
)

await closePool()
