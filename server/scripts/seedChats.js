// Vuelve a poner las conversaciones de ejemplo de src/data/mockData.js dentro
// del día que está abierto ahora:
//
//   node scripts/seedChats.js almacen-dona-rosa
//
// A diferencia de seed.js (que siembra todo el negocio una sola vez y no toca
// nada si ya hay productos), esto es solo la bandeja: los mensajes de ejemplo
// quedan colgados del día en el que se sembraron, y cuando ese día se cierra la
// bandeja los deja de mostrar. Se corren de nuevo acá, con las fechas corridas
// para que caigan dentro del día abierto.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, run, closePool } from '../src/db/index.js'
import { initialMessages, contactMeta } from '../../src/data/mockData.js'

const ref = process.argv[2]

if (!ref) {
  console.error('Uso: node scripts/seedChats.js <tenantId|slug>')
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

const day = await one(
  `SELECT id, opened_at AS "openedAt" FROM days WHERE tenant_id = $1 AND status = 'open' LIMIT 1`,
  [tenantId],
)
if (!day) {
  console.error(`${tenant.name} no tiene ningún día abierto. Abrilo desde la dashboard y volvé a correr esto.`)
  await closePool()
  process.exit(1)
}

// Los mensajes de ejemplo tienen fechas fijas de 2026-08-10. Se corren en bloque
// para que el último caiga diez minutos atrás y el resto conserve la separación
// que tenían entre sí; así el hilo se lee como una charla de hoy. El piso es la
// apertura del día: un mensaje anterior a eso queda colgado de un día que
// todavía no había empezado.
const stamps = initialMessages.map((m) => new Date(m.createdAt).getTime())
const last = Math.max(...stamps)
const first = Math.min(...stamps)
const openedAt = new Date(day.openedAt).getTime()
let offset = Date.now() - 10 * 60 * 1000 - last
if (first + offset < openedAt) offset = openedAt + 60 * 1000 - first

// Las ids de mockData ('m1', 'm1r', …) ya están usadas por el sembrado anterior
// y la primaria es (tenant_id, id). Se les cuelga un sufijo del día, que es
// distinto en cada corrida y además dice a qué día pertenece la copia.
const sufijo = day.id.replace(/[^0-9]/g, '').slice(0, 12)

const yaEstaba = await one('SELECT id FROM messages WHERE tenant_id = $1 AND id = $2', [
  tenantId,
  `${initialMessages[0].id}-${sufijo}`,
])
if (yaEstaba) {
  console.log(`[seedChats] ${tenant.name}: los chats de ejemplo ya están en el día abierto`)
  await closePool()
  process.exit(0)
}

const customerByPhone = new Map()
for (const m of initialMessages) {
  if (m.direction === 'in') customerByPhone.set(m.phone, m.customer)
}
for (const m of initialMessages) {
  if (!customerByPhone.has(m.phone)) customerByPhone.set(m.phone, m.customer)
}

// El teléfono es la identidad de la conversación: si el contacto ya existe de un
// sembrado anterior se le refresca la ficha en vez de duplicarlo.
for (const [phone, customer] of customerByPhone) {
  const meta = contactMeta[phone] ?? {}
  const ultimoEntrante = initialMessages
    .filter((m) => m.phone === phone && m.direction === 'in')
    .reduce((max, m) => Math.max(max, new Date(m.createdAt).getTime()), 0)
  const lastInbound = ultimoEntrante ? new Date(ultimoEntrante + offset).toISOString() : null
  const updatedAt = new Date(
    Math.max(...initialMessages.filter((m) => m.phone === phone).map((m) => new Date(m.createdAt).getTime())) + offset,
  ).toISOString()

  await run(
    `INSERT INTO conversations (tenant_id, phone, channel, customer, agent, assignee, last_inbound_at, created_at, updated_at)
     VALUES ($1, $2, 'whatsapp', $3, $4, $5, $6, $7, $7)
     ON CONFLICT (tenant_id, phone) DO UPDATE
       SET customer = EXCLUDED.customer,
           agent = EXCLUDED.agent,
           assignee = EXCLUDED.assignee,
           last_inbound_at = EXCLUDED.last_inbound_at,
           updated_at = EXCLUDED.updated_at`,
    [tenantId, phone, customer, meta.agent ?? 'recepcion', meta.assignee ?? null, lastInbound, updatedAt],
  )
}

for (const m of initialMessages) {
  await run(
    `INSERT INTO messages (tenant_id, id, phone, customer, text, direction, type, status, author, day_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tenantId,
      `${m.id}-${sufijo}`,
      m.phone,
      m.customer,
      m.text,
      m.direction,
      m.type ?? null,
      m.status ?? null,
      m.author ?? null,
      day.id,
      new Date(new Date(m.createdAt).getTime() + offset).toISOString(),
    ],
  )
}

console.log(
  `[seedChats] ${tenant.name}: ${customerByPhone.size} conversaciones y ${initialMessages.length} mensajes en el día ${day.id}`,
)

await closePool()
