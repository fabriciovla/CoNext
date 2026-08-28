// Las etiquetas de días son las mismas que usa el frontend en `weekDays`
// (mockData.js), indexadas por Date#getDay(): 0 es domingo.
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const ZONA_POR_DEFECTO = 'America/Argentina/Buenos_Aires'

const INDICE_POR_DIA_EN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

// Qué día y qué hora es **para el negocio**, no para el server.
//
// Esto existía como `now.getDay()` y `now.getHours()`, que leen la hora local
// del proceso. En una máquina argentina daba bien de casualidad; en Railway el
// contenedor corre en UTC y el negocio quedaba tres horas corrido. Peor todavía
// con el día: a las 21:00 de Argentina ya es el día siguiente en UTC, así que
// un viernes a la noche se evaluaba contra el horario del sábado — y si el
// sábado estaba cerrado, el local "cerraba" a las 21 todos los viernes.
//
// `Intl` es lo que sabe de husos y de horario de verano; hacer la cuenta a mano
// con un offset fijo se rompe sola dos veces al año.
export function partesEnZona(now, timeZone = ZONA_POR_DEFECTO) {
  let partes
  try {
    partes = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now)
  } catch {
    // Una zona inválida guardada en la base no puede dejar al negocio sin
    // atender: se cae a la hora del server, que es lo que había antes.
    return { dayIndex: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() }
  }

  const buscar = (tipo) => partes.find((p) => p.type === tipo)?.value
  // A medianoche `hour12: false` puede devolver "24" en vez de "00".
  const hora = Number(buscar('hour')) % 24

  return {
    dayIndex: INDICE_POR_DIA_EN[buscar('weekday')] ?? now.getDay(),
    minutes: hora * 60 + Number(buscar('minute')),
  }
}

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

  // El día y la hora salen de la zona del negocio, no de la del server.
  const { dayIndex: todayIndex, minutes } = partesEnZona(now, settings.timezone)
  const todaySlot = getDayHours(settings, DAY_LABELS[todayIndex])
  const previousSlot = getDayHours(settings, DAY_LABELS[(todayIndex + 6) % 7])
  if ((todaySlot && !validSlot(todaySlot)) || (previousSlot && !validSlot(previousSlot))) return true
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
// Cuándo vuelve a abrir. Se recorre por índice de día y minutos en la zona del
// negocio, en vez de ir corriendo un `Date` con `setDate`/`setHours`: esos dos
// escriben en la hora local del proceso, así que en un server en UTC devolvían
// el día equivocado igual que `isWithinBusinessHours`.
//
// Ya no devuelve `date`. Nadie lo usaba —el único que llama es el prompt, que
// arma la frase con `day` y `openTime`— y un instante exacto solo se puede
// construir bien conociendo el huso, que es justo de lo que se trata este
// arreglo.
export function getNextBusinessOpening(settings, now = new Date()) {
  const { dayIndex, minutes } = partesEnZona(now, settings?.timezone)

  for (let offset = 0; offset <= 7; offset += 1) {
    const indice = (dayIndex + offset) % 7
    const slot = getDayHours(settings, DAY_LABELS[indice])
    const open = toMinutes(slot?.openTime)
    if (open === null) continue

    // Hoy solo cuenta si la apertura todavía no pasó.
    if (offset === 0 && open <= minutes) continue

    return { day: DAY_LABELS[indice], openTime: slot.openTime }
  }
  return null
}
