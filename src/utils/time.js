// Formato de hora de toda la dashboard. Estaba copiado en seis componentes, y
// alcanzaba con que uno quedara distinto para que la misma hora se leyera de dos
// formas en la misma pantalla (la lista de chats está al lado del hilo).
//
// `hourCycle: 'h23'` y no `hour12: false`: los dos dan 24 horas, pero `hour12`
// deja el ciclo h24, donde la medianoche se escribe "24:00" en vez de "00:00".
//
// La hora **no** sigue al idioma de la dashboard, y es a propósito: con h23
// forzado, 'es-AR' y 'en-US' dan exactamente el mismo "14:35", así que el locale
// no cambiaría nada; y dejarlo suelto pasaría el hilo entero a AM/PM, que
// ensancha cada globo y hace que la misma hora se lea distinto según quién mire.
// Un reloj de 24 h es el de WhatsApp, que es lo que esta pantalla refleja.
const HORA = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatTime(iso) {
  return HORA.format(new Date(iso))
}

// "jueves 27 de agosto" / "Thursday, August 27". Va en la bajada del encabezado
// de Inicio, que es la única pantalla que habla del día de hoy sin nombrarlo en
// ningún otro lado.
//
// Esta sí sigue al idioma: acá cambian el nombre del mes, el del día y el orden
// de los tres, que es justamente lo que un formateador por locale resuelve y
// una plantilla escrita a mano no.
const FECHA_LARGA = { weekday: 'long', day: 'numeric', month: 'long' }

export function formatLongDate(date = new Date(), locale = 'es-AR') {
  // En español el día de la semana va en minúscula, pero acá abre la línea y
  // una frase que empieza en minúscula se lee como si le faltara algo adelante.
  // En inglés ya viene en mayúscula y esto no lo toca.
  const texto = new Intl.DateTimeFormat(locale, FECHA_LARGA).format(date)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
