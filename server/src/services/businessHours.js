// Las etiquetas de días son las mismas que usa el frontend en `weekDays`
// (mockData.js), indexadas por Date#getDay(): 0 es domingo.
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function toMinutes(hhmm) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

// ¿El local está atendiendo en este momento? Ante cualquier configuración
// incompleta devuelve true: preferimos que el bot conteste de más y no que se
// quede mudo todo el día por un horario mal cargado.
export function isWithinBusinessHours(settings, now = new Date()) {
  if (!settings) return true

  const daysOpen = Array.isArray(settings.daysOpen) ? settings.daysOpen : []
  if (daysOpen.length === 0) return true
  if (!daysOpen.includes(DAY_LABELS[now.getDay()])) return false

  const open = toMinutes(settings.openTime)
  const close = toMinutes(settings.closeTime)
  if (open === null || close === null) return true

  const minutes = now.getHours() * 60 + now.getMinutes()

  // Turno que cruza la medianoche (ej. 20:00 a 02:00). El día de apertura se
  // evalúa contra el día en que arranca el turno, que es como lo piensa quien
  // carga el horario.
  if (close <= open) return minutes >= open || minutes < close
  return minutes >= open && minutes < close
}
