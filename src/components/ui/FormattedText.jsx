// Las marcas de formato de WhatsApp, dibujadas.
//
// El CRM tiene que mostrar lo mismo que ve el cliente en su teléfono. Con el
// texto crudo, un precio resaltado se lee "*$12500*" acá y en negrita allá, y
// quien revisa un borrador antes de mandarlo no tiene forma de saber cómo va a
// salir. Peor todavía con los borradores de la IA, que es donde el formato
// aparece siempre.
//
// El servidor ya traduce el Markdown del modelo a marcas de WhatsApp antes de
// guardar (`services/ai/whatsappFormat.js`), así que lo que llega acá debería
// venir con una sola marca. La regla de `**negrita**` está igual porque en la
// base quedaron mensajes viejos, de antes de esa traducción, y sin ella se
// siguen viendo con los asteriscos puestos.

// Orden: gana la marca que empieza más a la izquierda, y entre dos que empiezan
// en el mismo lugar, la primera de esta lista. Buscar por orden de lista en vez
// de por posición rompía los anidados — en "_hola *che* qué tal_" la negrita
// aparece antes en la lista, se llevaba el centro y dejaba las itálicas
// sueltas, sin cierre, mostrando los guiones bajos.
const REGLAS = [
  { re: /```([\s\S]+?)```/, Tag: 'code', className: 'font-mono text-[0.92em]' },
  { re: /(?<![\w`])`([^`\n]+)`(?![\w`])/, Tag: 'code', className: 'font-mono text-[0.92em]' },
  // Markdown heredado. Va antes que la de un asterisco para que "**x**" se lea
  // entero y no como un asterisco suelto pegado a otro.
  { re: /(?<![\w*])\*\*(?!\s)([\s\S]*?\S)\*\*(?![\w*])/, Tag: 'strong', className: 'font-semibold' },
  { re: /(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/, Tag: 'strong', className: 'font-semibold' },
  { re: /(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/, Tag: 'em', className: 'italic' },
  { re: /(?<![\w~])~(?!\s)([^~\n]+?)(?<!\s)~(?![\w~])/, Tag: 's', className: 'line-through' },
]

// Las marcas piden que no haya espacio pegado por dentro y que por fuera no
// haya letra ni número. Es lo que evita que "2 * 3" o "el_valor_x" se coman
// media línea creyendo que abrieron un formato.
function partir(texto, clave = 'f') {
  if (!texto) return []

  let mejor = null
  for (const regla of REGLAS) {
    const m = regla.re.exec(texto)
    if (m && (mejor === null || m.index < mejor.m.index)) mejor = { m, regla }
  }
  if (!mejor) return [texto]

  const { m, regla } = mejor
  const { Tag, className } = regla

  // El contenido se vuelve a partir: adentro de una negrita puede haber una
  // itálica. Siempre es más corto que lo que entró (la marca se descarta), así
  // que la recursión termina.
  return [
    ...partir(texto.slice(0, m.index), `${clave}a`),
    <Tag key={`${clave}-${m.index}`} className={className}>
      {partir(m[1], `${clave}d`)}
    </Tag>,
    ...partir(texto.slice(m.index + m[0].length), `${clave}z`),
  ]
}

export default function FormattedText({ children }) {
  return <>{partir(String(children ?? ''))}</>
}

// Para los lugares de una sola línea (la vista previa de la lista): ahí el
// formato no se dibuja, se saca. Media docena de filas con una palabra en
// negrita cada una es ruido, y dejar los asteriscos es peor.
export function stripFormat(texto) {
  return String(texto ?? '')
    .replace(/```([\s\S]+?)```/g, '$1')
    .replace(/(?<![\w`])`([^`\n]+)`(?![\w`])/g, '$1')
    .replace(/(?<![\w*])\*\*(?!\s)([\s\S]*?\S)\*\*(?![\w*])/g, '$1')
    .replace(/(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g, '$1')
    .replace(/(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/g, '$1')
    .replace(/(?<![\w~])~(?!\s)([^~\n]+?)(?<!\s)~(?![\w~])/g, '$1')
}
