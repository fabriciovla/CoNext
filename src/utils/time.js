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

// "jueves 27 de agosto". Va en la bajada del encabezado de Inicio, que es la
// única pantalla que habla del día de hoy sin nombrarlo en ningún otro lado.
const FECHA_LARGA = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatLongDate(date = new Date()) {
  // En español el día de la semana va en minúscula, pero acá abre la línea y
  // una frase que empieza en minúscula se lee como si le faltara algo adelante.
  const texto = FECHA_LARGA.format(date)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
