import { one, run } from '../db/index.js'

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

export async function getSettings(tenantId) {
  const row = await one('SELECT * FROM settings WHERE tenant_id = $1', [tenantId])
  return row ? mapRow(row) : null
}

export async function updateSettings(tenantId, changes) {
  const current = (await getSettings(tenantId)) ?? {}
  const next = { ...current, ...changes }

  // El renglón lo crea provisionTenant en el alta, así que acá alcanzaría un
  // UPDATE. Se deja el upsert igual para que un tenant cuyo alta quedó a medias
  // se pueda arreglar guardando la configuración, en vez de fallar en silencio.
  await run(
    `INSERT INTO settings (tenant_id, store_name, whatsapp_number, open_time, close_time, days_open, welcome_message, away_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (tenant_id) DO UPDATE SET
       store_name = EXCLUDED.store_name,
       whatsapp_number = EXCLUDED.whatsapp_number,
       open_time = EXCLUDED.open_time,
       close_time = EXCLUDED.close_time,
       days_open = EXCLUDED.days_open,
       welcome_message = EXCLUDED.welcome_message,
       away_message = EXCLUDED.away_message`,
    [
      tenantId,
      next.storeName ?? '',
      next.whatsappNumber ?? '',
      next.openTime ?? '09:00',
      next.closeTime ?? '18:00',
      JSON.stringify(next.daysOpen ?? []),
      next.welcomeMessage ?? '',
      // awayMessage puede faltar si el cliente manda un settings parcial de
      // antes de que existiera el campo.
      next.awayMessage ?? '',
    ],
  )

  return getSettings(tenantId)
}
