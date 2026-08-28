import * as whatsappAdapter from './whatsappAdapter.js'
import { crearAdapter } from './metaAdapter.js'

// Instagram y Messenger salen del mismo módulo: son la misma API (Messenger
// Platform) con dos destinatarios distintos. `instagramAdapter.js` era un
// archivo aparte que hablaba de un `IG_BUSINESS_ACCOUNT_ID` global del .env —
// eso no sobrevive al multi-cliente, donde cada negocio tiene su propia cuenta.
const adapters = {
  whatsapp: whatsappAdapter,
  instagram: crearAdapter('instagram'),
  messenger: crearAdapter('messenger'),
}

export function resolveAdapter(channel) {
  const adapter = adapters[channel]
  if (!adapter) throw new Error(`Canal desconocido: ${channel}`)
  return adapter
}
