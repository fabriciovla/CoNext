// Formato de los números de contacto: +54 (381) 111-1111
//
// Los números llegan en dos formatos y ninguno es el que se muestra. El webhook
// de Meta guarda el `wa_id` pelado (`5493812345678`) y los datos de ejemplo del
// seed están escritos a mano (`+54 9 11 2345-6789`). Todo se normaliza a
// dígitos antes de decidir nada, así los dos terminan igual en pantalla.

// Códigos de área argentinos de 3 dígitos. El resto de la regla es corta: `11`
// es el único de 2, y todo lo que no esté acá adentro es de 4. Entre área y
// abonado el número nacional siempre suma 10 dígitos, así que con el largo del
// área queda determinado dónde arranca el abonado.
const AREAS_3 = new Set([
  '220', '221', '223', '230', '236', '237', '249', '260', '261', '263', '264',
  '266', '280', '291', '297', '299', '341', '342', '343', '345', '348', '351',
  '353', '358', '362', '364', '370', '376', '379', '380', '381', '383', '385',
  '387', '388',
])

function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

// Parte el número nacional (10 dígitos) en área + abonado.
function partirNacional(nsn) {
  if (nsn.startsWith('11')) return [nsn.slice(0, 2), nsn.slice(2)]
  if (AREAS_3.has(nsn.slice(0, 3))) return [nsn.slice(0, 3), nsn.slice(3)]
  return [nsn.slice(0, 4), nsn.slice(4)]
}

// El abonado se corta al medio, con el grupo corto adelante cuando el largo es
// impar: 8 dígitos van 4-4, 7 van 3-4 y 6 van 3-3.
function partirAbonado(abonado) {
  const corte = Math.floor(abonado.length / 2)
  return `${abonado.slice(0, corte)}-${abonado.slice(corte)}`
}

// Para mostrar. Nunca para marcar ni para mandarle a la API: eso es `toE164`.
export function formatPhone(valor) {
  const digitos = soloDigitos(valor)
  if (!digitos) return ''

  if (digitos.startsWith('54')) {
    let nsn = digitos.slice(2)
    // El 9 que Meta mete en el `wa_id` no se muestra: es un prefijo para marcar
    // un móvil, no parte del número que la persona te dicta.
    if (nsn.length === 11 && nsn.startsWith('9')) nsn = nsn.slice(1)
    if (nsn.length === 10) {
      const [area, abonado] = partirNacional(nsn)
      return `+54 (${area}) ${partirAbonado(abonado)}`
    }
  }

  // Otro país, o un número que no cierra (uno de prueba, uno cargado a mano a
  // medias). Se le pone el `+` y nada más: agruparlo con la regla argentina
  // sería inventarle una forma que no tiene.
  if (digitos.length >= 8) return `+${digitos}`
  return String(valor ?? '')
}

// Para `tel:` y para cualquier cosa que tenga que marcar de verdad. Acá el 9 sí
// va: es lo que hace que la llamada salga al móvil.
export function toE164(valor) {
  const digitos = soloDigitos(valor)
  return digitos ? `+${digitos}` : ''
}

// Para buscar. En pantalla el número se ve `+54 (381) 234-5678`, así que tipear
// "381 234" tiene que encontrarlo igual que "3812345".
export function phoneDigits(valor) {
  return soloDigitos(valor)
}
