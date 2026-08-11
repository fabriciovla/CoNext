// Una conversación es todo lo que pasó con un número: mensajes en los dos
// sentidos, notas internas y eventos del sistema, ordenado cronológicamente.
//
// Dos cosas se cuentan aparte a propósito:
//   · los contadores (pendientes / automáticos) miran solo los entrantes — lo
//     que mandó la tienda no es algo "pendiente de revisión";
//   · la vista previa de la lista muestra el último mensaje real, no la última
//     nota ni el último evento: la lista es un índice de la charla con el
//     cliente, y una traza del sistema ahí no dice nada.
const ES_MENSAJE = (m) => m.direction === 'in' || m.direction === 'out'

// `assignments` son los responsables que se cambiaron en vivo desde el chat;
// lo que no está ahí cae en el responsable que trae `contactsMeta` (lifecycle/
// agent/assignee por teléfono, servido por GET /conversations/meta).
export function groupMessagesByPhone(messages, assignments = {}, contactsMeta = {}) {
  const byPhone = new Map()

  for (const message of messages) {
    if (!byPhone.has(message.phone)) byPhone.set(message.phone, [])
    byPhone.get(message.phone).push(message)
  }

  const groups = Array.from(byPhone.entries()).map(([phone, groupMessages]) => {
    const sorted = [...groupMessages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    )
    const conversados = sorted.filter(ES_MENSAJE)
    const last = conversados[conversados.length - 1] ?? sorted[sorted.length - 1]
    const entrantes = sorted.filter((m) => m.direction === 'in')
    const meta = contactsMeta[phone] ?? {}

    return {
      phone,
      customer: entrantes[entrantes.length - 1]?.customer ?? last.customer,
      lastAt: last.createdAt,
      lastText: last.text,
      lastFromStore: last.direction === 'out',
      lastFromBot: last.direction === 'out' && last.author === 'bot',
      messages: sorted,
      total: conversados.length,
      automaticos: entrantes.filter((m) => m.type === 'automatico').length,
      pendientes: entrantes.filter((m) => m.status === 'pendiente').length,
      notas: sorted.filter((m) => m.direction === 'nota').length,
      lifecycle: meta.lifecycle ?? 'nuevo',
      tags: meta.tags ?? [],
      agent: meta.agent ?? 'recepcion',
      assignee: phone in assignments ? assignments[phone] : (meta.assignee ?? null),
    }
  })

  return groups.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
}
