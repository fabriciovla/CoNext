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

// Un adjunto sin epígrafe no tiene texto, y en la lista quedaba una fila muda:
// la conversación se veía saltar arriba de todo sin decir por qué. Se nombra lo
// que se mandó, como hace cualquier chat.
const NOMBRE_ADJUNTO = {
  image: 'Foto',
  audio: 'Audio',
  video: 'Video',
  document: 'Archivo',
}

// Exportada porque el aviso del escritorio muestra lo mismo que la fila de la
// lista: un adjunto sin epígrafe tiene que decir "Foto" en los dos lados y no
// quedar mudo.
export function vistaPrevia(message) {
  if (message.text) return message.text
  if (message.mediaKind) {
    return message.mediaKind === 'document' && message.mediaName
      ? message.mediaName
      : NOMBRE_ADJUNTO[message.mediaKind]
  }
  return ''
}

// `assignments` son los responsables que se cambiaron en vivo desde el chat;
// lo que no está ahí cae en el responsable que trae `contactsMeta` (agente,
// responsable y etiquetas por teléfono, servido por GET /conversations/meta).
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
      lastText: vistaPrevia(last),
      lastFromStore: last.direction === 'out',
      lastFromBot: last.direction === 'out' && last.author === 'bot',
      messages: sorted,
      total: conversados.length,
      automaticos: entrantes.filter((m) => m.type === 'automatico').length,
      pendientes: entrantes.filter((m) => m.status === 'pendiente').length,
      notas: sorted.filter((m) => m.direction === 'nota').length,
      tags: meta.tags ?? [],
      agent: meta.agent ?? 'recepcion',
      // Sin canal es WhatsApp: las conversaciones anteriores a Instagram y
      // Messenger no lo traen, y era el unico canal que habia.
      channel: meta.channel ?? 'whatsapp',
      assignee: phone in assignments ? assignments[phone] : (meta.assignee ?? null),
    }
  })

  return groups.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
}
