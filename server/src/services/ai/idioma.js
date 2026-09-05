// El idioma en el que la IA le escribe al cliente.
//
// La lista de idiomas válidos y las instrucciones para el modelo son la misma
// cosa y viven juntas a propósito: el allow-list del setting es literalmente
// `Object.keys(INSTRUCCIONES)`, así que no hay forma de agregar un idioma a la
// pantalla y olvidarse de decirle al modelo qué hacer con él — que es como el
// setting se guardaría bien y la respuesta saldría en español igual, en
// silencio.
//
// Está acá adentro y no en `settingsService` porque `systemPrompt` lo necesita
// y ese módulo no puede depender del pool de Postgres: importarlo desde ahí
// hacía que armar un prompt exigiera un `DATABASE_URL` cargado.
//
// 'auto' no es un idioma: es contestar en el que haya escrito el cliente, que
// es lo que necesita un negocio que atiende turistas o vende afuera.
//
// Su instrucción es la más larga de las cuatro y la que más parece que sobra, y
// no sobra: la primera versión decía "respondé en el mismo idioma en el que
// escribió el cliente" y **no alcanzaba**. A un "Hi, what do you sell?" le
// contestaba en español, porque el prompt entero está escrito en español y el
// modelo arrastra ese idioma por encima de una línea que dice lo contrario. Lo
// que lo destraba es decirle con todas las letras que el idioma del prompt no
// tiene nada que ver con el de la respuesta. Las otras tres no lo necesitan
// porque nombran su idioma y no dependen de mirar nada.
//
// El tono "argentino" viaja adentro de cada idioma y no afuera. Pedirle a la
// vez que escriba en inglés y con voz argentina es pedirle dos cosas que se
// pelean, y lo que sale son modismos traducidos.
export const INSTRUCCIONES = {
  auto: `Mirá el ÚLTIMO mensaje del cliente y contestá en ESE idioma, sea cual sea.
  TODO este prompt está escrito en español y eso no tiene nada que ver con el idioma de la
  respuesta: si el cliente escribió en inglés, la respuesta va entera en inglés; si escribió en
  portugués, entera en portugués. Solo si el cliente escribió en español contestá en español
  rioplatense (de vos, no de tú). Si el último mensaje no deja identificar el idioma —un "ok", un
  emoji, un número—, seguí el de los mensajes anteriores de esta misma conversación, y si tampoco
  hay, contestá en español.`,
  es: `Respondé SIEMPRE en español rioplatense (de vos, no de tú), con tono argentino, aunque el
  cliente escriba en otro idioma.`,
  en: `Respondé SIEMPRE en inglés, aunque el cliente escriba en otro idioma. Inglés natural y
  neutro, ni británico ni marcadamente estadounidense — nada de traducir modismos argentinos.`,
  pt: `Respondé SIEMPRE en portugués de Brasil, aunque el cliente escriba en otro idioma.
  Portugués natural — nada de traducir modismos argentinos.`,
}

export const AI_LANGUAGES = Object.keys(INSTRUCCIONES)

// 'es' y no 'auto': es lo que ya venían haciendo todos los tenants creados, y
// el default no es el lugar para cambiarle a nadie cómo le contesta el bot a
// sus clientes.
export const AI_LANGUAGE_POR_DEFECTO = 'es'

export function instruccionDeIdioma(valor) {
  return INSTRUCCIONES[valor] ?? INSTRUCCIONES[AI_LANGUAGE_POR_DEFECTO]
}
