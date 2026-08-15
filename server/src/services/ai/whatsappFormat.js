// WhatsApp no entiende Markdown, y un modelo de lenguaje escribe Markdown por
// defecto. El resultado es que al cliente le llega "**$12500**" con los
// asteriscos a la vista, que es exactamente lo contrario de resaltar un precio.
//
// El prompt ya le pide al modelo que escriba en formato de WhatsApp; esto es la
// red abajo. Un modelo se sale del formato cada tanto por más explícita que sea
// la instrucción, y acá lo barato es traducir, no reintentar.
//
// Equivalencias:
//   Markdown          WhatsApp
//   **negrita**   ->  *negrita*
//   __negrita__   ->  *negrita*
//   ~~tachado~~   ->  ~tachado~
//   # Título      ->  *Título*
//   [texto](url)  ->  texto: url
//   * ítem        ->  - ítem
//
// La itálica de un solo asterisco (*así*) no se traduce a propósito: después de
// convertir `**x**` en `*x*` ya no hay forma de distinguir una de la otra, y
// equivocarse ahí significa desarmar la negrita que se acaba de armar. La
// itálica con guiones bajos (_así_) ya es la de WhatsApp y pasa derecho.

// Marcador de los bloques de código mientras dura la traducción. Va con NUL a
// los costados y no con algo tipeable (`__0__`, `[[0]]`): cualquier cosa que se
// pueda escribir puede aparecer de verdad en una respuesta, y entonces la
// restauración se comería texto del cliente. NUL no lo escribe nadie.
//
// Se arma en runtime y no como literal, porque un NUL escrito en el fuente es
// un byte invisible que cualquier editor o formateador puede comerse sin
// avisar, y el día que eso pase la traducción deja de restaurar los bloques.
const NUL = String.fromCharCode(0)
const MARCADOR = new RegExp(NUL + '(\\d+)' + NUL, 'g')

// Los bloques de código se sacan del camino antes de tocar nada: adentro de un
// bloque, un asterisco es un asterisco y no una marca de formato.
function protegerCodigo(texto) {
  const bloques = []
  const protegido = texto.replace(/```[\s\S]*?```|`[^`\n]+`/g, (match) => {
    bloques.push(match)
    return `${NUL}${bloques.length - 1}${NUL}`
  })
  return { protegido, bloques }
}

function restaurarCodigo(texto, bloques) {
  return texto.replace(MARCADOR, (entero, i) => bloques[Number(i)] ?? entero)
}

export function markdownToWhatsapp(texto) {
  if (typeof texto !== 'string' || texto === '') return texto

  const { protegido, bloques } = protegerCodigo(texto)

  const salida = protegido
    // Las viñetas van primero: en este punto un "* " al principio de la línea
    // es sin ambigüedad una viñeta, porque una negrita nunca lleva espacio
    // pegado al asterisco de apertura. Después de traducir las negritas ya no
    // se podría afirmar lo mismo.
    .replace(/^[ \t]*[*+][ \t]+/gm, '- ')
    // Títulos: WhatsApp no tiene, así que quedan en negrita, que es para lo que
    // el modelo los usa igual.
    .replace(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*#*$/gm, '*$1*')
    // Negrita + itálica juntas.
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '_*$1*_')
    .replace(/___(?=\S)([\s\S]*?\S)___/g, '_*$1*_')
    // Negrita.
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '*$1*')
    .replace(/__(?=\S)([\s\S]*?\S)__/g, '*$1*')
    // Tachado.
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '~$1~')
    // Links: WhatsApp los detecta solo si van pelados. El texto del link se
    // conserva porque suele ser lo único que explica a dónde lleva.
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1: $2')

  return restaurarCodigo(salida, bloques)
}
