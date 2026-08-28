import { ZONA_POR_DEFECTO } from './businessHours.js'
import { one, run } from '../db/index.js'

export const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value ?? ''))
}

// Convierte el horario único anterior al nuevo formato sin perder la
// configuración de ningún tenant ya creado.
export function weeklyHoursFromLegacy({ daysOpen = [], openTime = '09:00', closeTime = '18:00' }) {
  const abiertos = new Set(Array.isArray(daysOpen) ? daysOpen : [])
  return Object.fromEntries(
    WEEK_DAYS.map((day) => [
      day,
      abiertos.has(day) && validTime(openTime) && validTime(closeTime)
        ? { openTime, closeTime }
        : null,
    ]),
  )
}

export function normalizeWeeklyHours(value, fallback = {}) {
  return Object.fromEntries(
    WEEK_DAYS.map((day) => {
      // `null` significa cerrado y no puede caer al fallback con `??`.
      const slot =
        value && Object.prototype.hasOwnProperty.call(value, day)
          ? value[day]
          : fallback?.[day]
      return [
        day,
        slot && validTime(slot.openTime) && validTime(slot.closeTime)
          ? { openTime: slot.openTime, closeTime: slot.closeTime }
          : null,
      ]
    }),
  )
}

function mapRow(row) {
  const daysOpen = parseJson(row.days_open, [])
  const legacy = weeklyHoursFromLegacy({
    daysOpen,
    openTime: row.open_time,
    closeTime: row.close_time,
  })
  const storedWeeklyHours = parseJson(row.weekly_hours, {})
  const weeklyHours =
    storedWeeklyHours && Object.keys(storedWeeklyHours).length > 0
      ? normalizeWeeklyHours(storedWeeklyHours, legacy)
      : legacy

  return {
    storeName: row.store_name,
    whatsappNumber: row.whatsapp_number,
    openTime: row.open_time,
    closeTime: row.close_time,
    daysOpen,
    weeklyHours,
    welcomeMessage: row.welcome_message,
    awayMessage: row.away_message,
    // La zona del negocio, no la del server: ver businessHours.partesEnZona.
    timezone: row.timezone || ZONA_POR_DEFECTO,
  }
}

export async function getSettings(tenantId) {
  const row = await one('SELECT * FROM settings WHERE tenant_id = $1', [tenantId])
  return row ? mapRow(row) : null
}

export async function updateSettings(tenantId, changes) {
  const current = (await getSettings(tenantId)) ?? {}
  const next = { ...current, ...changes }
  const weeklyHours = normalizeWeeklyHours(
    changes.weeklyHours,
    current.weeklyHours ?? weeklyHoursFromLegacy(next),
  )
  const daysOpen = WEEK_DAYS.filter((day) => weeklyHours[day])
  const firstOpen = weeklyHours[daysOpen[0]] ?? {
    openTime: next.openTime ?? '09:00',
    closeTime: next.closeTime ?? '18:00',
  }

  // El renglón lo crea provisionTenant en el alta, así que acá alcanzaría un
  // UPDATE. Se deja el upsert igual para que un tenant cuyo alta quedó a medias
  // se pueda arreglar guardando la configuración, en vez de fallar en silencio.
  await run(
    `INSERT INTO settings (tenant_id, store_name, whatsapp_number, open_time, close_time, days_open, weekly_hours, welcome_message, away_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (tenant_id) DO UPDATE SET
       store_name = EXCLUDED.store_name,
       whatsapp_number = EXCLUDED.whatsapp_number,
       open_time = EXCLUDED.open_time,
       close_time = EXCLUDED.close_time,
       days_open = EXCLUDED.days_open,
       weekly_hours = EXCLUDED.weekly_hours,
       welcome_message = EXCLUDED.welcome_message,
       away_message = EXCLUDED.away_message`,
    [
      tenantId,
      next.storeName ?? '',
      next.whatsappNumber ?? '',
      firstOpen.openTime,
      firstOpen.closeTime,
      JSON.stringify(daysOpen),
      JSON.stringify(weeklyHours),
      next.welcomeMessage ?? '',
      // awayMessage puede faltar si el cliente manda un settings parcial de
      // antes de que existiera el campo.
      next.awayMessage ?? '',
    ],
  )

  return getSettings(tenantId)
}
