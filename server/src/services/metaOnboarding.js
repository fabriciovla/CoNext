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
// la tiene atada. Es lo que la pantalla usa para el selector.
export async function listarPaginas(userAccessToken) {
  const data = await graph(
    `${GRAPH()}/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=100`,
    { headers: { Authorization: `Bearer ${userAccessToken}` } },
  )
  return (data?.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.name,
    igAccountId: p.instagram_business_account?.id ?? null,
    igUsername: p.instagram_business_account?.username ?? null,
  }))
}

// Paso 2: el token de la Página elegida.
//
// Se pide con el token de usuario largo, y por eso este no vence. Es el que
// después firma cada envío y cada consulta de perfil.
async function getPagina(pageId, userAccessToken) {
  return graph(`${GRAPH()}/${pageId}?fields=name,access_token,instagram_business_account{id,username}`, {
    headers: { Authorization: `Bearer ${userAccessToken}` },
  })
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

// Para la pantalla de estado: si esto responde, el token de Página sirve de
// verdad. Un token revocado desde el Business Manager del cliente sigue
// guardado en nuestra base y ahí diríamos "conectado" sin estarlo.
export async function getInfoPagina(pageId, pageAccessToken) {
  return graph(`${GRAPH()}/${pageId}?fields=name,username,instagram_business_account{id,username}`, {
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  })
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
  const pagina = await getPagina(pageId, tokenLargo)

  const pageAccessToken = pagina?.access_token
  if (!pageAccessToken) {
    throw new Error('Meta no devolvió el token de la Página. Revisá que tengas permiso de administrarla.')
  }

  const avisos = []

  // La suscripción sí es crítica: sin webhooks no entra nada.
  await suscribirPagina(pageId, pageAccessToken)

  const igAccountId = pagina.instagram_business_account?.id ?? null
  if (!igAccountId) {
    avisos.push(
      'La Página no tiene una cuenta de Instagram profesional asociada, así que solo queda ' +
        'conectado Messenger. Se ata desde la configuración de la Página en Facebook.',
    )
  }

  return {
    pageId,
    pageName: pagina.name ?? null,
    pageAccessToken,
    igAccountId,
    igUsername: pagina.instagram_business_account?.username ?? null,
    avisos,
  }
}
