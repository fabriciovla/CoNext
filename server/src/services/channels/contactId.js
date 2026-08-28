// El id de contacto: lo que va en `conversations.phone`.
//
// Esa columna se llama `phone` porque nació cuando el único canal era WhatsApp,
// y es la identidad de una conversación en todo el CRM: la clave primaria
// `(tenant_id, phone)`, el FK compuesto de `messages` y `conversation_tags`, la
// key de React, `assignments[phone]`, `drafts[phone]`. Renombrarla es tocar
// ~230 lugares para no ganar nada.
//
// Instagram y Messenger no traen teléfonos: traen IGSIDs y PSIDs, que son
// dígitos opacos y del mismo largo que un `wa_id`. Guardados pelados serían
// indistinguibles, y dos canales podrían caer en la misma fila — que es fusionar
// las conversaciones de dos personas distintas.
//
// Por eso todo lo que no es WhatsApp va prefijado. El namespace queda disjunto
// por construcción, sin migrar la clave primaria:
//
//   whatsapp   5493811234567          (pelado, como siempre)
//   instagram  ig:17841405793187218
//   messenger  fb:24680135791113151
//
// WhatsApp no lleva prefijo a propósito: las filas que ya existen quedan
// válidas y no hay que migrar nada.
const PREFIJOS = { instagram: 'ig', messenger: 'fb' }

// El id externo -> el id de contacto que guardamos.
export function aContactId(channel, externalId) {
  const prefijo = PREFIJOS[channel]
  return prefijo ? `${prefijo}:${externalId}` : String(externalId)
}

// El id de contacto -> el id que espera la API de Meta. Es lo que usa el
// adapter antes de mandar: Graph quiere el IGSID pelado, no nuestro prefijo.
export function aIdExterno(contactId) {
  const s = String(contactId ?? '')
  const i = s.indexOf(':')
  return i === -1 ? s : s.slice(i + 1)
}
