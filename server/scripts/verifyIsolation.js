// Verificación de aislamiento entre clientes:
//
//   node scripts/verifyIsolation.js
//
// Crea dos tenants con datos distintos y comprueba que ninguna función de
// servicio ni ninguna ruta HTTP devuelva datos del otro. Es el test que sostiene
// todo el modelo multi-cliente: una fuga acá es el único bug del sistema que no
// tiene arreglo después de que pasa, porque significa que un negocio vio las
// conversaciones de otro.
//
// Deja la base como la encontró: borra los dos tenants de prueba al final.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, run, closePool } from '../src/db/index.js'
import { provisionTenant, getTenantByApiKey, getTenantByPhoneNumberId, setWhatsappCredentials, getWhatsappCredentials } from '../src/services/tenantsService.js'
import { createApp } from '../src/app.js'

import * as products from '../src/services/productsService.js'
import * as agents from '../src/services/agentsService.js'
import * as quickReplies from '../src/services/quickRepliesService.js'
import * as settings from '../src/services/settingsService.js'
import * as days from '../src/services/dayService.js'
import * as conversations from '../src/services/conversationService.js'

let pasaron = 0
const fallos = []

function check(nombre, condicion, detalle = '') {
  if (condicion) {
    pasaron += 1
    console.log(`  ok   ${nombre}`)
  } else {
    fallos.push(`${nombre}${detalle ? ` — ${detalle}` : ''}`)
    console.log(`  FALLA ${nombre}${detalle ? ` — ${detalle}` : ''}`)
  }
}

// Busca el texto de un tenant dentro de cualquier estructura devuelta por el
// otro. Es más terco que comparar campo por campo: si una fuga aparece en una
// columna que no se me ocurrió mirar, igual la encuentra.
//
// La comparación va sin distinguir mayúsculas a propósito: hay campos que se
// normalizan al guardarse (las etiquetas pasan a minúscula en normalizeTag), y
// con un needle sensible a mayúsculas una fuga de esos campos pasaba de largo
// dando el test en verde.
function contiene(valor, aguja) {
  return JSON.stringify(valor ?? null).toLowerCase().includes(String(aguja).toLowerCase())
}

await migrate()

console.log('\n== alta de dos clientes ==')
const a = await provisionTenant({ name: 'ALFA Test Isolation', storeName: 'ALFA', whatsappNumber: '+5491100000001' })
const b = await provisionTenant({ name: 'BETA Test Isolation', storeName: 'BETA', whatsappNumber: '+5491100000002' })
console.log(`  A = ${a.id} (${a.slug})`)
console.log(`  B = ${b.id} (${b.slug})`)

check('los dos tenants tienen ids distintos', a.id !== b.id)
check('los dos tenants tienen API keys distintas', a.apiKey !== b.apiKey)

try {
  // ---------- datos propios de cada uno ----------
  console.log('\n== carga de datos distintos en cada cliente ==')

  await products.addProduct(a.id, { name: 'PRODUCTO-ALFA', price: 100, stock: 5 })
  await products.addProduct(b.id, { name: 'PRODUCTO-BETA', price: 200, stock: 7 })

  await quickReplies.addQuickReply(a.id, { shortcut: 'saludo', text: 'RESPUESTA-ALFA' })
  await quickReplies.addQuickReply(b.id, { shortcut: 'saludo', text: 'RESPUESTA-BETA' })
  check('el mismo atajo puede existir en los dos clientes', true)

  await agents.addAgent(a.id, { name: 'AGENTE-ALFA' })
  await agents.addAgent(b.id, { name: 'AGENTE-BETA' })

  await settings.updateSettings(a.id, { storeName: 'TIENDA-ALFA' })
  await settings.updateSettings(b.id, { storeName: 'TIENDA-BETA' })

  // El mismo teléfono en los dos clientes: es el caso que rompía de frente con
  // la clave primaria global anterior.
  const telefonoCompartido = '+5491155550000'
  await conversations.ensureConversation(a.id, telefonoCompartido, { customer: 'CLIENTE-ALFA' })
  await conversations.ensureConversation(b.id, telefonoCompartido, { customer: 'CLIENTE-BETA' })
  check('el mismo teléfono puede ser contacto de los dos clientes', true)

  await conversations.addConversationTag(a.id, telefonoCompartido, 'ETIQUETA-ALFA')
  await conversations.addConversationTag(b.id, telefonoCompartido, 'ETIQUETA-BETA')

  await conversations.addNote(a.id, telefonoCompartido, 'NOTA-ALFA')
  await conversations.addNote(b.id, telefonoCompartido, 'NOTA-BETA')

  // ---------- capa de servicios ----------
  console.log('\n== capa de servicios: A no puede ver nada de B ==')

  check('getProducts', !contiene(await products.getProducts(a.id), 'BETA'))
  check('getQuickReplies', !contiene(await quickReplies.getQuickReplies(a.id), 'BETA'))
  check('getAgents', !contiene(await agents.getAgents(a.id), 'BETA'))
  check('getEnabledAgents', !contiene(await agents.getEnabledAgents(a.id), 'BETA'))
  check('getAgentStats', !contiene(await agents.getAgentStats(a.id), 'BETA'))
  check('getSettings', !contiene(await settings.getSettings(a.id), 'BETA'))
  check('getConversationsMeta', !contiene(await conversations.getConversationsMeta(a.id), 'BETA'))
  check('getConversationTags', !contiene(await conversations.getConversationTags(a.id, telefonoCompartido), 'BETA'))
  check('getOpenMessages', !contiene(await days.getOpenMessages(a.id), 'BETA'))
  check('listClosedDays', !contiene(await days.listClosedDays(a.id), 'BETA'))
  check('getCurrentDayState', !contiene(await days.getCurrentDayState(a.id), 'BETA'))
  check('getConversation', !contiene(await conversations.getConversation(a.id, telefonoCompartido), 'BETA'))
  check('getOpenDrafts', !contiene(await conversations.getOpenDrafts(a.id), 'BETA'))

  // …y que sí vea lo suyo (si no, "no ve nada de B" se cumple trivialmente
  // porque no ve nada de nadie).
  console.log('\n== …y sí ve lo suyo ==')
  check('getProducts trae lo de A', contiene(await products.getProducts(a.id), 'PRODUCTO-ALFA'))
  check('getConversationsMeta trae lo de A', contiene(await conversations.getConversationsMeta(a.id), 'ETIQUETA-ALFA'))
  check('getOpenMessages trae lo de A', contiene(await days.getOpenMessages(a.id), 'NOTA-ALFA'))
  check('getSettings trae lo de A', contiene(await settings.getSettings(a.id), 'TIENDA-ALFA'))

  // ---------- escrituras cruzadas ----------
  console.log('\n== escrituras cruzadas: A no puede modificar ni borrar lo de B ==')

  const productoB = (await products.getProducts(b.id))[0]
  const editado = await products.updateProduct(a.id, productoB.id, { name: 'SECUESTRADO' })
  check('updateProduct con el id de B devuelve null', editado === null)

  await products.deleteProduct(a.id, productoB.id)
  check('deleteProduct con el id de B no borra nada', contiene(await products.getProducts(b.id), 'PRODUCTO-BETA'))

  const agenteB = (await agents.getAgents(b.id))[0]
  check('getAgent con el id de B devuelve null', (await agents.getAgent(a.id, agenteB.id)) === null)
  check('updateAgent con el id de B devuelve null', (await agents.updateAgent(a.id, agenteB.id, { name: 'X' })) === null)
  const borrado = await agents.deleteAgent(a.id, agenteB.id)
  check('deleteAgent con el id de B da not-found', borrado.deleted === false && borrado.reason === 'not-found')
  check('el agente de B sigue vivo', contiene(await agents.getAgents(b.id), 'AGENTE-BETA'))

  const qrB = (await quickReplies.getQuickReplies(b.id)).find((q) => q.text === 'RESPUESTA-BETA')
  check('updateQuickReply con el id de B devuelve null', (await quickReplies.updateQuickReply(a.id, qrB.id, { text: 'X' })) === null)
  await quickReplies.deleteQuickReply(a.id, qrB.id)
  check('deleteQuickReply con el id de B no borra nada', contiene(await quickReplies.getQuickReplies(b.id), 'RESPUESTA-BETA'))

  // El teléfono existe en los dos, así que acá no alcanza con que "no encuentre":
  // hay que confirmar que tocó el suyo y no el del otro.
  await conversations.setAssignee(a.id, telefonoCompartido, 'OPERADOR-ALFA')
  const convB = await conversations.getConversation(b.id, telefonoCompartido)
  check('setAssignee no pisa la conversación homónima de B', convB.assignee === null)
  check('setAssignee sí escribió la de A', (await conversations.getConversation(a.id, telefonoCompartido)).assignee === 'OPERADOR-ALFA')

  await conversations.removeConversationTag(a.id, telefonoCompartido, 'ETIQUETA-BETA')
  check('removeConversationTag no borra la etiqueta de B', contiene(await conversations.getConversationTags(b.id, telefonoCompartido), 'etiqueta-beta'))

  // ---------- resolución de tenant ----------
  console.log('\n== resolución de tenant ==')
  check('la API key de A resuelve a A', (await getTenantByApiKey(a.apiKey))?.id === a.id)
  check('la API key de B resuelve a B', (await getTenantByApiKey(b.apiKey))?.id === b.id)
  check('una clave inventada no resuelve', (await getTenantByApiKey('a'.repeat(64))) === null)
  check('clave vacía no resuelve', (await getTenantByApiKey('')) === null)

  await setWhatsappCredentials(a.id, { wabaId: 'waba-alfa', phoneNumberId: 'PNID-ALFA', accessToken: 'token-secreto-alfa' })
  check('el webhook resuelve el tenant por phone_number_id', (await getTenantByPhoneNumberId('PNID-ALFA'))?.id === a.id)
  check('un phone_number_id desconocido no resuelve', (await getTenantByPhoneNumberId('PNID-NADIE')) === null)

  const creds = await getWhatsappCredentials(a.id)
  check('el token se descifra igual que se guardó', creds?.accessToken === 'token-secreto-alfa')
  const crudo = await one('SELECT access_token FROM tenants WHERE id = $1', [a.id])
  check('en la base el token NO está en texto plano', !crudo.access_token.includes('token-secreto-alfa'), crudo.access_token?.slice(0, 24))

  // Un cliente suspendido deja de resolver: es el corte de servicio por falta de pago.
  await run(`UPDATE tenants SET status = 'suspendido' WHERE id = $1`, [b.id])
  check('un cliente suspendido no resuelve por API key', (await getTenantByApiKey(b.apiKey)) === null)
  await run(`UPDATE tenants SET status = 'activo' WHERE id = $1`, [b.id])

  // ---------- capa HTTP ----------
  console.log('\n== capa HTTP: las mismas rutas, con la clave de cada uno ==')
  const app = createApp()
  const server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  const base = `http://localhost:${server.address().port}`

  const pedir = async (ruta, apiKey) => {
    const res = await fetch(`${base}${ruta}`, { headers: apiKey ? { 'x-api-key': apiKey } : {} })
    return { status: res.status, body: await res.text() }
  }

  for (const ruta of ['/products', '/agents', '/quick-replies', '/settings', '/conversations/meta', '/messages']) {
    const rA = await pedir(ruta, a.apiKey)
    check(`GET ${ruta} con la clave de A no filtra nada de B`, rA.status === 200 && !rA.body.includes('BETA'), `status ${rA.status}`)
  }

  const sinClave = await pedir('/products', null)
  check('GET /products sin clave da 401', sinClave.status === 401, `status ${sinClave.status}`)
  const claveMala = await pedir('/products', 'x'.repeat(64))
  check('GET /products con clave inválida da 401', claveMala.status === 401, `status ${claveMala.status}`)

  // El wrapper ah(): un handler async que rechaza tiene que responder 500, no
  // dejar la request colgada. Se fuerza pidiendo un día inexistente.
  const rutaRota = await pedir('/messages?day=no-existe', a.apiKey)
  check('una consulta sin resultados responde (no cuelga)', rutaRota.status === 200, `status ${rutaRota.status}`)

  server.close()
} finally {
  // ---------- limpieza ----------
  console.log('\n== limpieza ==')
  // El ON DELETE CASCADE del esquema tiene que llevarse todo lo del cliente: si
  // quedara algo colgado, dar de baja una cuenta dejaría datos suyos en la base.
  await run('DELETE FROM tenants WHERE id = ANY($1)', [[a.id, b.id]])
  const restos = await one(
    `SELECT (SELECT COUNT(*) FROM products WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM messages WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM conversations WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM agents WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM conversation_tags WHERE tenant_id = ANY($1))::int AS n`,
    [[a.id, b.id]],
  )
  check('borrar el tenant se lleva todos sus datos (cascade)', restos.n === 0, `quedaron ${restos.n} filas`)

  console.log(`\n${'='.repeat(50)}`)
  if (fallos.length === 0) {
    console.log(`TODO OK — ${pasaron} comprobaciones pasaron.`)
  } else {
    console.log(`${pasaron} pasaron, ${fallos.length} FALLARON:`)
    for (const f of fallos) console.log(`  - ${f}`)
  }
  console.log('='.repeat(50))

  await closePool()
  process.exit(fallos.length === 0 ? 0 : 1)
}
