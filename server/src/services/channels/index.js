import * as whatsappAdapter from './whatsappAdapter.js'
import * as instagramAdapter from './instagramAdapter.js'

const adapters = {
  whatsapp: whatsappAdapter,
  instagram: instagramAdapter,
}

export function resolveAdapter(channel) {
  const adapter = adapters[channel]
  if (!adapter) throw new Error(`Canal desconocido: ${channel}`)
  return adapter
}
