import { ZONA_POR_DEFECTO } from './businessHours.js'
import { one, run } from '../db/index.js'
// La lista de idiomas vive con las instrucciones que le tocan a cada uno, en
// `ai/idioma.js`: son la misma cosa y separarlas es cómo se agrega un idioma a
// la pantalla sin decirle al modelo qué hacer con él.
import { AI_LANGUAGES, AI_LANGUAGE_POR_DEFECTO } from './ai/idioma.js'

export const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// El idioma de la IA sí se valida contra una lista cerrada, al revés que la
// zona: cada valor tiene su instrucción escrita a mano para el modelo, así que
// uno que no esté en la lista dejaría el prompt sin nada que decir.
function validAiLanguage(value) {
  return AI_LANGUAGES.includes(value)
}

// La zona se valida contra Intl y no contra una lista nuestra: la pantalla
// ofrece una docena, pero cualquier nombre IANA que el navegador sepa resolver
// sirve igual, y una lista escrita a mano se queda vieja sola. Una zona que no
// existe rompería `partesEnZona` en cada mensaje entrante, no acá.
function validTimezone(value) {
  if (typeof value !== 'string' || !value) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
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
    // En qué idioma redacta la IA. No es el idioma de la dashboard: ese es una
    // preferencia del navegador de quien mira y no llega nunca al server.
    aiLanguage: row.ai_language || AI_LANGUAGE_POR_DEFECTO,
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
  // Una zona inválida no es motivo para rechazar el guardado entero: lo que
  // manda la pantalla son todos los settings juntos, y tirar el PUT por esto
  // perdería también el mensaje que se estaba escribiendo. Se queda la que había.
  const timezone = validTimezone(changes.timezone)
    ? changes.timezone
    : current.timezone || ZONA_POR_DEFECTO
  // Mismo criterio que la zona: un idioma que no conocemos no tira el PUT
  // entero, se queda el que había.
  const aiLanguage = validAiLanguage(changes.aiLanguage)
    ? changes.aiLanguage
    : current.aiLanguage || AI_LANGUAGE_POR_DEFECTO
  const firstOpen = weeklyHours[daysOpen[0]] ?? {
    openTime: next.openTime ?? '09:00',
    closeTime: next.closeTime ?? '18:00',
  }

  // El renglón lo crea provisionTenant en el alta, así que acá alcanzaría un
  // UPDATE. Se deja el upsert igual para que un tenant cuyo alta quedó a medias
  // se pueda arreglar guardando la configuración, en vez de fallar en silencio.
  await run(
    `INSERT INTO settings (tenant_id, store_name, whatsapp_number, open_time, close_time, days_open, weekly_hours, welcome_message, away_message, timezone, ai_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (tenant_id) DO UPDATE SET
       store_name = EXCLUDED.store_name,
       whatsapp_number = EXCLUDED.whatsapp_number,
       open_time = EXCLUDED.open_time,
       close_time = EXCLUDED.close_time,
       days_open = EXCLUDED.days_open,
       weekly_hours = EXCLUDED.weekly_hours,
       welcome_message = EXCLUDED.welcome_message,
       away_message = EXCLUDED.away_message,
       timezone = EXCLUDED.timezone,
       ai_language = EXCLUDED.ai_language`,
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
      timezone,
      aiLanguage,
    ],
  )

  return getSettings(tenantId)
}
