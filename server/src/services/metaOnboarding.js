// Onboarding de Instagram y Messenger vía Facebook Login.
//
// Se parece al de WhatsApp pero **no es el mismo flujo**, y la diferencia es a
// propósito.
//
// Embedded Signup (WhatsApp) devuelve un `code` y nada más: el número lo eligió
// el cliente adentro del popup de Meta, así que no hay nada que preguntarle
// después. Acá sí lo hay — un negocio puede administrar varias Páginas, y no
// hay forma de adivinar cuál quiere atender por el CRM. Con el flujo de `code`
// el navegador no recibe ningún token, así que no podría listar las Páginas
// para que la persona elija, y el código vive 30 segundos: no alcanza para
// mostrar un selector, esperar el click y recién ahí canjearlo.
//
// Por eso este usa el flujo de token: el SDK deja un token de usuario de corta
// vida en el navegador, la pantalla lista las Páginas con él y recién cuando la
// persona eligió manda `{ accessToken, pageId }`. El APP SECRET sigue sin salir
// del server, que es lo que importa.

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'
const GRAPH = () => `https://graph.facebook.com/${GRAPH_VERSION}`

// Los permisos que pide el popup. `pages_messaging` es el que deja contestar
// por Messenger; `instagram_manage_messages`, por Instagram. Los dos dependen
// de la verificación del negocio y del App Review: sin eso, el popup solo
// funciona para las cuentas que tengan un rol en la app.
export const PERMISOS = [
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_messages',
  'business_management',
].join(',')

// Los campos del webhook a los que hay que suscribir la Página. `messages` es
// el que trae los entrantes de los dos canales; los otros dos son los acuses.
const CAMPOS_WEBHOOK = 'messages,messaging_postbacks,message_deliveries,message_reads'

async function graph(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data?.error
    const detalle = err?.error_user_msg || err?.message || `HTTP ${res.status}`
    const e = new Error(detalle)
    e.metaCode = err?.code ?? null
    e.status = res.status
    throw e
  }
  return data
}

// Paso 1: cambiar el token corto del navegador por uno largo.
//
// No es cosmético. El token que deja el SDK dura ~1 hora, y los tokens de
// Página que se saquen con él heredan ese vencimiento: la conexión andaría toda
// la tarde y moriría sola de madrugada, sin ningún error visible más que una
// bandeja que dejó de recibir. Los tokens de Página sacados con un token de
// usuario **largo** no vencen, que es lo que hace que esto se conecte una vez y
// listo — justo lo que a WhatsApp todavía le falta.
export async function aTokenLargo(tokenCorto) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('Faltan META_APP_ID y META_APP_SECRET en el .env del server')
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: tokenCorto,
  })
  const data = await graph(`${GRAPH()}/oauth/access_token?${params}`)

  if (!data?.access_token) throw new Error('Meta no devolvió un token largo')
  return data.access_token
}

// Las Páginas que administra la persona, con su cuenta de Instagram al lado si
// la tiene atada, y el token de cada una.
//
// `/me/accounts` ya devuelve el `access_token` de cada Página, así que **acá
// sale todo lo que hace falta para conectar**. Antes había un segundo viaje que
// le pedía a Graph la Página por su id (`GET /{page-id}?fields=access_token,…`)
// y eso falla con el error 100: leer el nodo de una Página exige
// `pages_read_engagement`, un permiso más que habría que sumar a la lista, y
// pedir un permiso de más para un dato que ya teníamos en la mano es al pedo.
//
// **El token de Página no sale de acá hacia el navegador**: la ruta que lista
// para el selector arma su propia respuesta sin él. Es la credencial que manda
// mensajes en nombre del negocio.
export async function listarPaginas(userAccessToken) {
  const data = await graph(
    `${GRAPH()}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100`,
    { headers: { Authorization: `Bearer ${userAccessToken}` } },
  )
  return (data?.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.name,
    accessToken: p.access_token ?? null,
    igAccountId: p.instagram_business_account?.id ?? null,
    igUsername: p.instagram_business_account?.username ?? null,
  }))
}

// Paso 3: suscribir nuestra app a la Página.
//
// Es el equivalente exacto de `subscribeApp` en WhatsApp y el paso que más se
// olvida, por el mismo motivo: sin esto la conexión queda "bien" —el token
// sirve, los envíos salen— pero Meta no nos manda ni un webhook y la bandeja
// no recibe nada nunca. Va con el token de la Página, no con el del usuario.
export async function suscribirPagina(pageId, pageAccessToken) {
  await graph(`${GRAPH()}/${pageId}/subscribed_apps?subscribed_fields=${CAMPOS_WEBHOOK}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  })
}

// Para la pantalla de estado: ¿el token de Página que tenemos guardado sigue
// sirviendo? Un token revocado desde el Business Manager del cliente sigue
// guardado en nuestra base, y ahí la pantalla diría "conectado" sin estarlo
// mientras no entra ni un mensaje.
//
// **Esto se pregunta con `debug_token` y no leyendo la Página**, y ahí está el
// punto. La versión anterior iba a `GET /me` con el token de Página, que es la
// forma de nombrarla sin saber su id — pero leer los datos de una Página, por
// `/me` o por id, exige `pages_read_engagement`, que no pedimos. O sea que la
// consulta **fallaba siempre**, y como el catch trataba cualquier error como
// token muerto, la tarjeta mostraba "Token vencido" y el error crudo de Graph
// sobre una conexión perfectamente sana, con un token que además no vence.
//
// `debug_token` no toca la Página: le pregunta a Meta por el token en sí,
// firmando con el token de app (`app_id|app_secret`). No pide ningún permiso
// sobre Páginas, y contesta exactamente lo que la pantalla quiere saber —
// incluido `is_valid`, que sí se cae cuando el cliente revoca el acceso, que
// era el motivo por el que esta comprobación existe.
//
// Lo que se pierde es refrescar el nombre de la Página y la cuenta de Instagram
// en cada visita a la pantalla: eso salía de la misma consulta que nunca
// funcionó, así que no se pierde nada que anduviera. Los dos datos se guardan
// al conectar y se vuelven a leer al reconectar, que es cuando `/me/accounts`
// los trae con el token de usuario y sin necesitar el permiso.
export async function verificarTokenPagina(pageAccessToken) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  // Sin credenciales de app no hay con qué firmar la consulta. No es lo mismo
  // que un token inválido, así que no se contesta que lo esté.
  if (!appId || !appSecret) return { valido: null, motivo: 'Faltan las credenciales de la app' }

  const url =
    `${GRAPH()}/debug_token?input_token=${encodeURIComponent(pageAccessToken)}` +
    `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`

  const data = await graph(url)
  const info = data?.data ?? {}

  return {
    valido: info.is_valid === true,
    // 0 es "no vence", que es lo normal en un token de Página sacado con un
    // token de usuario largo. Se distingue de "no vino el dato" a propósito.
    expiraEn: info.expires_at === 0 ? null : info.expires_at ?? null,
    scopes: info.scopes ?? [],
    motivo: info.error?.message ?? null,
  }
}

// El flujo completo, en el orden que importa.
//
// Devuelve `avisos` con la misma idea que el de WhatsApp: cosas que fallaron
// pero no invalidan la conexión. Acá el caso típico es un negocio con Página y
// sin Instagram profesional atado — Messenger queda andando y no tiene sentido
// abortar por el canal que no configuró.
export async function connectMetaAccount({ accessToken, pageId }) {
  if (!accessToken) throw new Error('Falta el token de acceso')
  if (!pageId) throw new Error('Falta elegir la Página')

  const tokenLargo = await aTokenLargo(accessToken)

  // La Página se busca en la misma lista que se le mostró a la persona, en vez
  // de pedírsela a Graph de nuevo: el dato ya vino completo y ese segundo viaje
  // era el que pedía `pages_read_engagement`.
  const paginas = await listarPaginas(tokenLargo)
  const pagina = paginas.find((p) => p.id === pageId)

  if (!pagina) {
    throw new Error('Esa Página no figura entre las que administrás. Probá conectar de nuevo.')
  }

  const pageAccessToken = pagina.accessToken
  if (!pageAccessToken) {
    throw new Error('Meta no devolvió el token de la Página. Revisá que tengas permiso de administrarla.')
  }

  const avisos = []

  // La suscripción sí es crítica: sin webhooks no entra nada.
  await suscribirPagina(pageId, pageAccessToken)

  const igAccountId = pagina.igAccountId
  if (!igAccountId) {
    avisos.push(
      'La Página no tiene una cuenta de Instagram profesional asociada, así que solo queda ' +
        'conectado Messenger. Se ata desde la configuración de la Página en Facebook.',
    )
  }

  return {
    pageId,
    pageName: pagina.nombre ?? null,
    pageAccessToken,
    igAccountId,
    igUsername: pagina.igUsername ?? null,
    avisos,
  }
}
