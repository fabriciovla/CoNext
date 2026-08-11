// Métricas derivadas del estado que ya existe (mensajes, productos, ajustes).
// Los widgets de Inicio no calculan nada por su cuenta: así ninguno inventa
// números y todos cuentan lo mismo (solo los entrantes son "actividad").

// getDay() devuelve 0 para domingo; las etiquetas coinciden con `weekDays`.
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function toMinutes(time) {
  const [hours, minutes] = String(time).split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

// Formatea una duración en minutos para mostrarla: 0,5 → "<1 min", 95 → "1 h 35 min".
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—'
  const total = Math.round(minutes)
  if (total < 1) return '<1 min'
  if (total < 60) return `${total} min`

  const hours = Math.floor(total / 60)
  const restMinutes = total % 60
  if (hours < 24) return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`

  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours === 0 ? `${days} d` : `${days} d ${restHours} h`
}

// Promedio de minutos entre un mensaje del cliente y la primera respuesta de la
// tienda en esa misma conversación. Los entrantes que todavía nadie contestó no
// cuentan (no tienen respuesta que medir): esos son los pendientes.
export function averageResponseMinutes(messages) {
  const byPhone = new Map()
  for (const message of messages) {
    if (!byPhone.has(message.phone)) byPhone.set(message.phone, [])
    byPhone.get(message.phone).push(message)
  }

  const gaps = []
  for (const conversation of byPhone.values()) {
    const sorted = [...conversation].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    )
    sorted.forEach((message, index) => {
      if (message.direction !== 'in') return
      const reply = sorted.slice(index + 1).find((next) => next.direction === 'out')
      if (!reply) return
      gaps.push((new Date(reply.createdAt) - new Date(message.createdAt)) / 60000)
    })
  }

  if (gaps.length === 0) return null
  return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
}

// Entrantes por hora del día. El rango arranca en el horario de atención y se
// estira si entraron mensajes fuera de ese horario, para no esconderlos.
export function messagesByHour(messages, { openTime, closeTime }) {
  const counts = new Map()
  for (const message of messages) {
    if (message.direction !== 'in') continue
    const hour = new Date(message.createdAt).getHours()
    counts.set(hour, (counts.get(hour) ?? 0) + 1)
  }

  const activeHours = [...counts.keys()]
  const from = Math.min(Math.floor(toMinutes(openTime) / 60), ...activeHours)
  const to = Math.max(Math.ceil(toMinutes(closeTime) / 60) - 1, ...activeHours)

  const bars = []
  for (let hour = from; hour <= to; hour++) {
    bars.push({ hour, total: counts.get(hour) ?? 0 })
  }
  return bars
}

// Estado del horario de atención configurado, comparado con el reloj.
export function storeSchedule(settings, now = new Date()) {
  const today = DAY_LABELS[now.getDay()]
  const isBusinessDay = settings.daysOpen.includes(today)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const opensAt = toMinutes(settings.openTime)
  const closesAt = toMinutes(settings.closeTime)

  let reason = 'abierto'
  if (!isBusinessDay) reason = 'no-laborable'
  else if (minutesNow < opensAt) reason = 'antes-de-abrir'
  else if (minutesNow >= closesAt) reason = 'ya-cerro'

  return { today, isBusinessDay, isOpen: reason === 'abierto', reason }
}

// Respuestas salientes separadas por quién las escribió.
export function repliesByAuthor(messages) {
  const salientes = messages.filter((m) => m.direction === 'out')
  const bot = salientes.filter((m) => m.author === 'bot').length
  return { total: salientes.length, bot, admin: salientes.length - bot }
}

// Productos que necesitan atención, del más urgente al menos: primero los que
// se quedaron sin stock. El umbral es el mismo que usa la tabla de Productos.
export function stockAlerts(products, threshold = 10) {
  return products
    .filter((product) => product.stock <= threshold)
    .sort((a, b) => a.stock - b.stock)
}

export function inventoryValue(products) {
  return products.reduce((sum, product) => sum + product.price * product.stock, 0)
}
