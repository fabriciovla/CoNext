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
// El tono "argentino" viaja adentro de cada idioma y no afuera. Pedirle a la
// vez que escriba en inglés y con voz argentina es pedirle dos cosas que se
// pelean, y lo que sale son modismos traducidos.
export const INSTRUCCIONES = {
  auto: `Respondé en el MISMO idioma en el que escribió el cliente, mirando su último mensaje.
  Si escribió en español, contestá en español rioplatense (de vos, no de tú). Si el idioma no se
  deja identificar —un "ok", un emoji, un número—, seguí el de los mensajes anteriores de esta
  misma conversación, y si tampoco hay, contestá en español.`,
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
