// Formato de hora de toda la dashboard. Estaba copiado en seis componentes, y
// alcanzaba con que uno quedara distinto para que la misma hora se leyera de dos
// formas en la misma pantalla (la lista de chats está al lado del hilo).
//
// `hourCycle: 'h23'` y no `hour12: false`: los dos dan 24 horas, pero `hour12`
// deja el ciclo h24, donde la medianoche se escribe "24:00" en vez de "00:00".
const HORA = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatTime(iso) {
  return HORA.format(new Date(iso))
}
