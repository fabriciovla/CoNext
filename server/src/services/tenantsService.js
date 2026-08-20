import crypto from 'node:crypto'
import { one, many, run, tx } from '../db/index.js'
import { encrypt, decrypt, hashApiKey, generateApiKey } from './secrets.js'
import { normalizeWeeklyHours, weeklyHoursFromLegacy } from './settingsService.js'

// Los agentes y las respuestas rápidas por defecto vivían dentro de las
// migraciones, cuando había un solo negocio y "aplicar la migración" y "dar de
// alta el negocio" eran el mismo momento. Con varios clientes dejan de serlo:
// esto es data de alta, no de esquema, y cada cliente arranca con su copia
// propia que después edita como quiera.
const AGENTES_POR_DEFECTO = [
  {
    key: 'recepcion',
    name: 'Recepcionista',
    emoji: '🤖',
    role: 'Primer contacto y consultas generales: saludos, horarios, ubicación, medios de pago, "¿están?", agradecimientos y cualquier mensaje que todavía no se sabe a dónde va.',
    instructions:
      'Sé breve y cálido. Respondé la consulta y, si el cliente todavía no dijo qué busca, preguntale en una línea en qué lo podés ayudar.',
    autoSend: 1,
  },
  {
    key: 'ventas',
    name: 'Agente de ventas',
    emoji: '💼',
    role: 'Consultas de compra: precio, stock, talles, colores, disponibilidad, comparaciones entre productos e intención explícita de comprar.',
    instructions:
      'Respondé con el precio y el stock exactos del catálogo. Si el producto está sin stock, decilo y ofrecé una alternativa del catálogo. No negocies descuentos ni prometas reservas.',
    autoSend: 1,
  },
  {
    key: 'soporte',
    name: 'Agente de soporte',
    emoji: '🎧',
    role: 'Posventa y problemas: estado del pedido, demoras, reclamos, cambios, devoluciones, problemas de pago y clientes molestos.',
    instructions:
      'Reconocé el problema antes de responder. Nunca confirmes reintegros, cancelaciones ni cambios por tu cuenta: eso lo resuelve el equipo, así que dejá la respuesta como borrador pendiente.',
    autoSend: 0,
  },
]

const RESPUESTAS_POR_DEFECTO = [
  {
    shortcut: 'envios',
    text: 'Hacemos envíos a todo el país por correo. El costo depende de la zona y te lo confirmamos antes de despachar 📦',
  },
  {
    shortcut: 'pago',
    text: 'Podés pagar por transferencia, efectivo o tarjeta. Si transferís, mandanos el comprobante y preparamos el pedido 😊',
  },
  {
    shortcut: 'gracias',
    text: '¡Gracias por tu compra! Cualquier cosa que necesites, escribinos por acá 🙌',
  },
]

function slugify(name) {
  return String(name)
    .normalize('NFD')
    // Rango de diacríticos combinantes (U+0300–U+036F), que el NFD de arriba
    // separó de su letra. Van como literales y son invisibles en el editor:
    // si el rango parece vacío, no lo "arregles" — está bien así.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Alta de un cliente: crea el tenant y todo lo que necesita para funcionar
// desde el primer mensaje (settings, agentes, respuestas rápidas y el día
// abierto). Va entero en una transacción — un tenant a medio crear es peor que
// ninguno, porque parece que está y falla recién cuando entra un mensaje.
//
// Devuelve la API key en texto plano **una sola vez**: en la base solo queda el
// hash, así que si se pierde hay que regenerarla.
export async function provisionTenant({ name, storeName, whatsappNumber, settings = {} }) {
  const id = `tenant-${crypto.randomUUID()}`
  const apiKey = generateApiKey()
  const now = new Date().toISOString()
  const openTime = settings.openTime ?? '09:00'
  const closeTime = settings.closeTime ?? '18:00'
  const daysOpen = settings.daysOpen ?? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
  const weeklyHours = normalizeWeeklyHours(
    settings.weeklyHours,
    weeklyHoursFromLegacy({ daysOpen, openTime, closeTime }),
  )

  // El slug tiene que ser único: si dos clientes se llaman parecido, se
  // desempata con un sufijo corto en vez de fallar el alta.
  let slug = slugify(name)
  if (await one('SELECT id FROM tenants WHERE slug = $1', [slug])) {
    slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`
  }

  await tx(async (client) => {
    await client.query(
      `INSERT INTO tenants (id, name, slug, status, api_key_hash, created_at, updated_at)
       VALUES ($1, $2, $3, 'activo', $4, $5, $5)`,
      [id, name, slug, hashApiKey(apiKey), now],
    )

    await client.query(
      `INSERT INTO settings (tenant_id, store_name, whatsapp_number, open_time, close_time, days_open, weekly_hours, welcome_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        storeName ?? name,
        whatsappNumber ?? '',
        openTime,
        closeTime,
        JSON.stringify(daysOpen),
        JSON.stringify(weeklyHours),
        settings.welcomeMessage ?? '¡Hola! Gracias por escribirnos 😊 ¿En qué te podemos ayudar?',
      ],
    )

    for (const [i, agente] of AGENTES_POR_DEFECTO.entries()) {
      await client.query(
        `INSERT INTO agents (tenant_id, id, key, name, emoji, role, instructions, enabled, auto_send, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $10, $10)`,
        [id, `agent-${agente.key}-${crypto.randomUUID()}`, agente.key, agente.name, agente.emoji, agente.role, agente.instructions, agente.autoSend, i, now],
      )
    }

    for (const [i, respuesta] of RESPUESTAS_POR_DEFECTO.entries()) {
      await client.query(
        `INSERT INTO quick_replies (tenant_id, id, shortcut, text, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [id, `qr-${respuesta.shortcut}-${crypto.randomUUID()}`, respuesta.shortcut, respuesta.text, i, now],
      )
    }

    // Sin un día abierto no se puede recibir ni un mensaje: handleIncomingMessage
    // corta con "No hay ningún día registrado todavía".
    await client.query(
      `INSERT INTO days (tenant_id, id, status, opened_at, closed_at) VALUES ($1, $2, 'open', $3, NULL)`,
      [id, `day-${now}`, now],
    )
  })

  return { id, name, slug, apiKey }
}

// Resuelve el tenant a partir de la API key que llega en el header. Es el punto
// por el que entra toda la API: si devuelve null, la request no ve nada.
export async function getTenantByApiKey(apiKey) {
  if (!apiKey) return null
  return (
    (await one(
      `SELECT id, name, slug, status FROM tenants WHERE api_key_hash = $1 AND status = 'activo'`,
      [hashApiKey(apiKey)],
    )) ?? null
  )
}

// El webhook de Meta es una sola URL para todos los clientes: lo único que
// distingue de quién es el mensaje es el phone_number_id que viene en el
// payload. Si esto no resuelve, el mensaje no se puede atribuir a nadie.
export async function getTenantByPhoneNumberId(phoneNumberId) {
  if (!phoneNumberId) return null
  return (
    (await one(
      `SELECT id, name, slug, status FROM tenants WHERE phone_number_id = $1 AND status = 'activo'`,
      [phoneNumberId],
    )) ?? null
  )
}

export async function getTenant(tenantId) {
  return (await one('SELECT id, name, slug, status, waba_id, phone_number_id, connected_at FROM tenants WHERE id = $1', [tenantId])) ?? null
}

export async function listTenants() {
  return many(
    `SELECT id, name, slug, status, waba_id, phone_number_id, connected_at, created_at
     FROM tenants ORDER BY created_at ASC`,
  )
}

// Credenciales de WhatsApp del cliente, descifradas. Las usa el adapter en
// cada envío, en vez de las variables de entorno que servían para un solo
// negocio.
export async function getWhatsappCredentials(tenantId) {
  const row = await one('SELECT waba_id, phone_number_id, access_token FROM tenants WHERE id = $1', [tenantId])
  if (!row?.phone_number_id || !row?.access_token) return null

  return {
    wabaId: row.waba_id,
    phoneNumberId: row.phone_number_id,
    accessToken: decrypt(row.access_token),
  }
}

// Lo que va a llamar el callback de Embedded Signup una vez que canjeó el
// código por el token con alcance del cliente.
export async function setWhatsappCredentials(tenantId, { wabaId, phoneNumberId, accessToken }) {
  const now = new Date().toISOString()
  await run(
    `UPDATE tenants SET waba_id = $1, phone_number_id = $2, access_token = $3, connected_at = $4, updated_at = $4
     WHERE id = $5`,
    [wabaId, phoneNumberId, encrypt(accessToken), now, tenantId],
  )
  return getTenant(tenantId)
}

// Rotación de la clave: devuelve la nueva en plano una sola vez, igual que el alta.
export async function rotateApiKey(tenantId) {
  const apiKey = generateApiKey()
  const filas = await run('UPDATE tenants SET api_key_hash = $1, updated_at = $2 WHERE id = $3', [
    hashApiKey(apiKey),
    new Date().toISOString(),
    tenantId,
  ])
  return filas === 0 ? null : { apiKey }
}
