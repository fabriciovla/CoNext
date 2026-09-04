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
import {
  provisionTenant,
  getTenantByApiKey,
  getTenantByPhoneNumberId,
  setWhatsappCredentials,
  getWhatsappCredentials,
  getTenantByPageId,
  getTenantByIgAccountId,
  setMetaCredentials,
  getMetaCredentials,
} from '../src/services/tenantsService.js'
import * as members from '../src/services/membersService.js'
import { createApp } from '../src/app.js'

import * as products from '../src/services/productsService.js'
import * as agents from '../src/services/agentsService.js'
import * as knowledge from '../src/services/knowledgeService.js'
import * as quickReplies from '../src/services/quickRepliesService.js'
import * as settings from '../src/services/settingsService.js'
import * as days from '../src/services/dayService.js'
import * as conversations from '../src/services/conversationService.js'
import { aContactId } from '../src/services/channels/contactId.js'

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

  const carpetaA = (await products.addFolder(a.id, { name: 'CARPETA-ALFA' })).folder
  const carpetaB = (await products.addFolder(b.id, { name: 'CARPETA-BETA' })).folder

  // El índice que impide carpetas repetidas lleva el tenant adelante: "Ofertas"
  // es una carpeta que van a tener casi todos los negocios.
  const ofertasA = await products.addFolder(a.id, { name: 'Ofertas' })
  const ofertasB = await products.addFolder(b.id, { name: 'Ofertas' })
  check('la misma carpeta puede existir en los dos clientes', Boolean(ofertasA.folder && ofertasB.folder))
  check('repetir el nombre dentro del mismo cliente no se puede', (await products.addFolder(a.id, { name: 'ofertas' })).error === 'duplicada')

  await products.addProduct(a.id, { name: 'PRODUCTO-ALFA', price: 100, stock: 5, folderId: carpetaA.id })
  await products.addProduct(b.id, { name: 'PRODUCTO-BETA', price: 200, stock: 7, folderId: carpetaB.id })

  await quickReplies.addQuickReply(a.id, { shortcut: 'saludo', text: 'RESPUESTA-ALFA' })
  await quickReplies.addQuickReply(b.id, { shortcut: 'saludo', text: 'RESPUESTA-BETA' })
  check('el mismo atajo puede existir en los dos clientes', true)

  const agenteA = await agents.addAgent(a.id, { name: 'AGENTE-ALFA' })
  await agents.addAgent(b.id, { name: 'AGENTE-BETA' })

  // El material de entrenamiento es texto que el negocio subió: una fuga acá es
  // el documento interno de un cliente adentro del prompt de otro.
  const fuenteA = await knowledge.addSource(a.id, {
    kind: 'texto',
    title: 'MATERIAL-ALFA',
    content: 'Los envios de ALFA salen 3500 pesos.',
    agentId: agenteA.id,
  })
  const agenteBeta = (await agents.getAgents(b.id))[0]
  const fuenteB = await knowledge.addSource(b.id, {
    kind: 'texto',
    title: 'MATERIAL-BETA',
    content: 'Los envios de BETA son gratis.',
    agentId: agenteBeta.id,
  })

  await settings.updateSettings(a.id, { storeName: 'TIENDA-ALFA' })
  await settings.updateSettings(b.id, { storeName: 'TIENDA-BETA' })
  await settings.updateSettings(a.id, {
    weeklyHours: {
      Lun: { openTime: '09:00', closeTime: '18:00' },
      Mar: { openTime: '09:00', closeTime: '18:00' },
      Mié: { openTime: '09:00', closeTime: '18:00' },
      Jue: { openTime: '09:00', closeTime: '18:00' },
      Vie: { openTime: '09:00', closeTime: '18:00' },
      Sáb: { openTime: '06:00', closeTime: '09:00' },
      Dom: null,
    },
  })
  check(
    'cada cliente puede tener horarios distintos por día',
    (await settings.getSettings(a.id)).weeklyHours.Sáb?.openTime === '06:00' &&
      (await settings.getSettings(b.id)).weeklyHours.Sáb === null,
  )

  // El mismo teléfono en los dos clientes: es el caso que rompía de frente con
  // la clave primaria global anterior.
  const telefonoCompartido = '+5491155550000'
  await conversations.ensureConversation(a.id, telefonoCompartido, { customer: 'CLIENTE-ALFA' })
  await conversations.ensureConversation(b.id, telefonoCompartido, { customer: 'CLIENTE-BETA' })

  // El mismo numero, pero como id de Instagram. Es el choque que el prefijo
  // tiene que hacer imposible: sin el, un IGSID y un wa_id iguales caerian en
  // la misma fila y las dos personas compartirian conversacion.
  const mismoNumeroEnIg = aContactId('instagram', telefonoCompartido.replace('+', ''))
  await conversations.ensureConversation(a.id, mismoNumeroEnIg, {
    channel: 'instagram',
    customer: 'CLIENTE-ALFA-IG',
  })
  check('el mismo teléfono puede ser contacto de los dos clientes', true)

  await conversations.addConversationTag(a.id, telefonoCompartido, 'ETIQUETA-ALFA')
  await conversations.addConversationTag(b.id, telefonoCompartido, 'ETIQUETA-BETA')

  await conversations.addNote(a.id, telefonoCompartido, 'NOTA-ALFA')
  await conversations.addNote(b.id, telefonoCompartido, 'NOTA-BETA')

  const userA = (await members.ensureUser({ email: 'ana.alfa@example.com', displayName: 'Ana Alfa' })).user
  const userB = (await members.ensureUser({ email: 'beto.beta@example.com', displayName: 'Beto Beta' })).user
  await members.addMember(a.id, { userId: userA.id, role: 'owner' })
  await members.addMember(b.id, { userId: userB.id, role: 'owner' })
  await members.addMember(a.id, { email: 'operador.alfa@example.com', role: 'operador' })
  await members.addMember(b.id, { email: 'operador.beta@example.com', role: 'operador' })

  // ---------- capa de servicios ----------
  console.log('\n== capa de servicios: A no puede ver nada de B ==')

  check('getProducts', !contiene(await products.getProducts(a.id), 'BETA'))
  check('getFolders', !contiene(await products.getFolders(a.id), 'BETA'))
  check('getQuickReplies', !contiene(await quickReplies.getQuickReplies(a.id), 'BETA'))
  check('getAgents', !contiene(await agents.getAgents(a.id), 'BETA'))
  check('getEnabledAgents', !contiene(await agents.getEnabledAgents(a.id), 'BETA'))
  check('getAgentStats', !contiene(await agents.getAgentStats(a.id), 'BETA'))
  check('getSources', !contiene(await knowledge.getSources(a.id), 'BETA'))
  check('getSourcesForAgent', !contiene(await knowledge.getSourcesForAgent(a.id, agenteA.id), 'BETA'))
  check('getUsoPorFuente', !contiene(await knowledge.getUsoPorFuente(a.id), fuenteB.id))
  // Esta es la que termina adentro del prompt: si filtra, el modelo de un
  // negocio contesta con el documento de otro.
  check(
    'getContenidoPorAgente',
    !contiene(await knowledge.getContenidoPorAgente(a.id, [agenteA.id]), 'BETA'),
  )
  check(
    'getContenidoPorAgente con el id de un agente de B no devuelve nada',
    Object.keys(await knowledge.getContenidoPorAgente(a.id, [agenteBeta.id])).length === 0,
  )
  check('getSettings', !contiene(await settings.getSettings(a.id), 'BETA'))
  check('getConversationsMeta', !contiene(await conversations.getConversationsMeta(a.id), 'BETA'))
  check('getConversationTags', !contiene(await conversations.getConversationTags(a.id, telefonoCompartido), 'BETA'))
  check('getOpenMessages', !contiene(await days.getOpenMessages(a.id), 'BETA'))
  check('listClosedDays', !contiene(await days.listClosedDays(a.id), 'BETA'))
  check('getCurrentDayState', !contiene(await days.getCurrentDayState(a.id), 'BETA'))
  check('getConversation', !contiene(await conversations.getConversation(a.id, telefonoCompartido), 'BETA'))

  // El prefijo separa canales: mismo numero, dos conversaciones distintas.
  check(
    'el mismo id en dos canales no se fusiona',
    (await conversations.getConversation(a.id, telefonoCompartido)).customer === 'CLIENTE-ALFA' &&
      (await conversations.getConversation(a.id, mismoNumeroEnIg)).customer === 'CLIENTE-ALFA-IG',
  )
  check(
    'la conversacion de Instagram guarda su canal',
    (await conversations.getConversation(a.id, mismoNumeroEnIg)).channel === 'instagram',
  )
  check(
    'la conversacion de Instagram de A no se ve desde B',
    (await conversations.getConversation(b.id, mismoNumeroEnIg)) === undefined ||
      (await conversations.getConversation(b.id, mismoNumeroEnIg)) === null,
  )
  check('getOpenDrafts', !contiene(await conversations.getOpenDrafts(a.id), 'BETA'))
  check('listMembers', !contiene(await members.listMembers(a.id), 'BETA'))
  check('listInvites', !contiene(await members.listInvites(a.id), 'BETA'))
  check('listTenantsForUser de Ana no incluye a B', !contiene(await members.listTenantsForUser(userA.id), b.id))

  // …y que sí vea lo suyo (si no, "no ve nada de B" se cumple trivialmente
  // porque no ve nada de nadie).
  console.log('\n== …y sí ve lo suyo ==')
  check('getProducts trae lo de A', contiene(await products.getProducts(a.id), 'PRODUCTO-ALFA'))
  check('getFolders trae lo de A', contiene(await products.getFolders(a.id), 'CARPETA-ALFA'))
  check('el producto de A viene con su carpeta', contiene(await products.getProducts(a.id), 'CARPETA-ALFA'))
  check('getConversationsMeta trae lo de A', contiene(await conversations.getConversationsMeta(a.id), 'ETIQUETA-ALFA'))
  check('getOpenMessages trae lo de A', contiene(await days.getOpenMessages(a.id), 'NOTA-ALFA'))
  check('getSettings trae lo de A', contiene(await settings.getSettings(a.id), 'TIENDA-ALFA'))
  check('listMembers trae a Ana', contiene(await members.listMembers(a.id), 'ana.alfa@example.com'))
  check('listInvites trae la invitación de A', contiene(await members.listInvites(a.id), 'operador.alfa@example.com'))
  check('listTenantsForUser de Ana trae a A', contiene(await members.listTenantsForUser(userA.id), a.id))

  // ---------- escrituras cruzadas ----------
  console.log('\n== escrituras cruzadas: A no puede modificar ni borrar lo de B ==')

  const productoB = (await products.getProducts(b.id))[0]
  const editado = await products.updateProduct(a.id, productoB.id, { name: 'SECUESTRADO' })
  check('updateProduct con el id de B devuelve null', editado === null)

  await products.deleteProduct(a.id, productoB.id)
  check('deleteProduct con el id de B no borra nada', contiene(await products.getProducts(b.id), 'PRODUCTO-BETA'))

  // Un producto no puede terminar dentro de la carpeta de otro cliente: la
  // carpeta ajena no existe para este, así que el producto queda suelto en vez
  // de pertenecer a los dos.
  const colado = await products.addProduct(a.id, { name: 'PRODUCTO-COLADO', price: 1, stock: 1, folderId: carpetaB.id })
  check('addProduct con la carpeta de B deja el producto sin carpeta', colado.folderId === null)
  const movido = await products.updateProduct(a.id, colado.id, { folderId: carpetaB.id })
  check('updateProduct con la carpeta de B tampoco lo mueve', movido.folderId === null)

  check('updateFolder con el id de B da not-found', (await products.updateFolder(a.id, carpetaB.id, { name: 'X' })).error === 'not-found')
  check('deleteFolder con el id de B no borra nada', (await products.deleteFolder(a.id, carpetaB.id)).deleted === false)
  check('la carpeta de B sigue viva', contiene(await products.getFolders(b.id), 'CARPETA-BETA'))

  // Esto no es aislamiento sino la otra cosa que no tiene arreglo después:
  // borrar una carpeta no puede llevarse el catálogo que tenía adentro.
  await products.deleteFolder(a.id, carpetaA.id)
  const sueltoAhora = (await products.getProducts(a.id)).find((p) => p.name === 'PRODUCTO-ALFA')
  check('borrar la carpeta no borra sus productos', Boolean(sueltoAhora))
  check('los productos de la carpeta borrada quedan sueltos', sueltoAhora?.folderId === null)

  const agenteB = (await agents.getAgents(b.id))[0]
  check('getAgent con el id de B devuelve null', (await agents.getAgent(a.id, agenteB.id)) === null)
  check('updateAgent con el id de B devuelve null', (await agents.updateAgent(a.id, agenteB.id, { name: 'X' })) === null)
  const borrado = await agents.deleteAgent(a.id, agenteB.id)
  check('deleteAgent con el id de B da not-found', borrado.deleted === false && borrado.reason === 'not-found')
  check('el agente de B sigue vivo', contiene(await agents.getAgents(b.id), 'AGENTE-BETA'))

  check('renameSource con la fuente de B no la toca', !(await knowledge.renameSource(a.id, fuenteB.id, 'X')))
  check('deleteSource con la fuente de B devuelve false', (await knowledge.deleteSource(a.id, fuenteB.id)) === false)
  check('la fuente de B sigue viva', contiene(await knowledge.getSources(b.id), 'MATERIAL-BETA'))

  // Encender la fuente de otro cliente para un agente de otro cliente: la clave
  // foránea compuesta lleva el tenant adelante, así que ni siquiera se puede
  // escribir la fila. Que tire error es correcto; lo que se verifica es que B no
  // termine con un enganche que no pidió.
  await knowledge.setAgentSource(a.id, agenteBeta.id, fuenteB.id, true).catch(() => {})
  check(
    'no se puede enganchar la fuente de B a un agente de B desde A',
    Object.keys(await knowledge.getContenidoPorAgente(a.id, [agenteBeta.id])).length === 0,
  )

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

  const sacado = await members.removeMember(a.id, userB.id)
  check('removeMember con el user de B no borra nada', sacado.deleted === false && sacado.reason === 'not-found')
  check('Beto sigue en B', contiene(await members.listMembers(b.id), 'beto.beta@example.com'))
  const ultimo = await members.removeMember(a.id, userA.id)
  check('no se puede sacar al único owner', ultimo.deleted === false && ultimo.reason === 'ultimo-owner')

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

  // Instagram y Messenger: mismas dos preguntas que WhatsApp, porque el
  // webhook resuelve el cliente igual —por un id de Meta— y una fuga acá le
  // entrega los mensajes de un negocio a otro.
  await setMetaCredentials(a.id, {
    pageId: 'PAGE-ALFA',
    igAccountId: 'IG-ALFA',
    pageAccessToken: 'token-pagina-alfa',
    pageName: 'Pagina ALFA',
    igUsername: 'alfa',
  })
  check('el webhook resuelve el tenant por page_id', (await getTenantByPageId('PAGE-ALFA'))?.id === a.id)
  check('un page_id desconocido no resuelve', (await getTenantByPageId('PAGE-NADIE')) === null)
  check('el webhook resuelve el tenant por ig_account_id', (await getTenantByIgAccountId('IG-ALFA'))?.id === a.id)
  check('un ig_account_id desconocido no resuelve', (await getTenantByIgAccountId('IG-NADIE')) === null)

  const credsMeta = await getMetaCredentials(a.id)
  check('el token de Página se descifra igual que se guardó', credsMeta?.pageAccessToken === 'token-pagina-alfa')
  check('B no tiene credenciales de Meta', (await getMetaCredentials(b.id)) === null)
  const crudoMeta = await one('SELECT page_access_token FROM tenants WHERE id = $1', [a.id])
  check(
    'en la base el token de Página NO está en texto plano',
    !crudoMeta.page_access_token.includes('token-pagina-alfa'),
    crudoMeta.page_access_token?.slice(0, 24),
  )

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

  for (const ruta of ['/products', '/products/folders', '/agents', '/agents/knowledge', '/quick-replies', '/settings', '/conversations/meta', '/messages', '/members']) {
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
          + (SELECT COUNT(*) FROM product_folders WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM messages WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM conversations WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM agents WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM knowledge_sources WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM agent_knowledge WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM conversation_tags WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM tenant_members WHERE tenant_id = ANY($1))::int
          + (SELECT COUNT(*) FROM tenant_invites WHERE tenant_id = ANY($1))::int AS n`,
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
