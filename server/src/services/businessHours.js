// Las etiquetas de días son las mismas que usa el frontend en `weekDays`
// (mockData.js), indexadas por Date#getDay(): 0 es domingo.
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function toMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function legacySlot(settings, day) {
  const daysOpen = Array.isArray(settings?.daysOpen) ? settings.daysOpen : []
  if (!daysOpen.includes(day)) return null
  return { openTime: settings.openTime, closeTime: settings.closeTime }
}

export function getDayHours(settings, day) {
  if (settings?.weeklyHours && Object.prototype.hasOwnProperty.call(settings.weeklyHours, day)) {
    return settings.weeklyHours[day]
  }
  return legacySlot(settings, day)
}

function validSlot(slot) {
  return toMinutes(slot?.openTime) !== null && toMinutes(slot?.closeTime) !== null
}

// ¿El local está atendiendo en este momento? Ante cualquier configuración
// incompleta devuelve true: preferimos que el bot conteste de más y no que se
// quede mudo todo el día por un horario mal cargado.
export function isWithinBusinessHours(settings, now = new Date()) {
  if (!settings) return true

  const explicitWeeklyHours =
    settings.weeklyHours &&
    DAY_LABELS.some((day) => Object.prototype.hasOwnProperty.call(settings.weeklyHours, day))
  const legacyDays = Array.isArray(settings.daysOpen) ? settings.daysOpen : []
  if (!explicitWeeklyHours && legacyDays.length === 0) return true

  const todayIndex = now.getDay()
  const todaySlot = getDayHours(settings, DAY_LABELS[todayIndex])
  const previousSlot = getDayHours(settings, DAY_LABELS[(todayIndex + 6) % 7])
  if ((todaySlot && !validSlot(todaySlot)) || (previousSlot && !validSlot(previousSlot))) return true

  const minutes = now.getHours() * 60 + now.getMinutes()
  const open = toMinutes(todaySlot?.openTime)
  const close = toMinutes(todaySlot?.closeTime)

  if (open !== null && close !== null) {
    if (close <= open && minutes >= open) return true
    if (close > open && minutes >= open && minutes < close) return true
  }

  // A la madrugada también puede seguir abierto el turno del día anterior.
  // Ejemplo: sábado 20:00–02:00 incluye el domingo hasta las 02:00 aunque el
  // domingo figure cerrado.
  const previousOpen = toMinutes(previousSlot?.openTime)
  const previousClose = toMinutes(previousSlot?.closeTime)
  return (
    previousOpen !== null &&
    previousClose !== null &&
    previousClose <= previousOpen &&
    minutes < previousClose
  )
}

// Próxima apertura para que el prompt pueda responder con un dato concreto
// cuando el negocio está cerrado.
export function getNextBusinessOpening(settings, now = new Date()) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    const slot = getDayHours(settings, DAY_LABELS[candidate.getDay()])
    const open = toMinutes(slot?.openTime)
    if (open === null) continue

    candidate.setHours(Math.floor(open / 60), open % 60, 0, 0)
    if (candidate > now) {
      return {
        date: candidate,
        day: DAY_LABELS[candidate.getDay()],
        openTime: slot.openTime,
      }
    }
  }
  return null
}
