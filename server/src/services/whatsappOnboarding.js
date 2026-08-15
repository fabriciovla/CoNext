// Onboarding de un número de WhatsApp vía Embedded Signup.
//
// Reemplaza a `scripts/connectWa.js`, que pide pegar un token a mano por
// terminal: eso sirve en desarrollo, pero no se le puede pedir a un cliente y
// —más importante— no se puede filmar como demo para la revisión de Meta, que
// justamente quiere ver al dueño del negocio dando el permiso él mismo.
//
// El navegador abre el popup de Meta y vuelve con tres cosas: un `code`, el
// `waba_id` y el `phone_number_id`. Todo lo demás pasa acá, en el server,
// porque hace falta el APP SECRET y ese no puede salir del backend nunca.

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

// Falla con un mensaje que se pueda mostrar en pantalla. Los errores de Graph
// vienen anidados en `error.message` y sin esto llegan como "500" pelado, que
// es justo cuando más se necesita saber qué pasó.
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

// Paso 1: canjear el código por un token con alcance del cliente.
//
// El código dura **30 segundos**, así que el frontend tiene que mandarlo apenas
// lo recibe: cualquier confirmación intermedia lo vence. A diferencia del OAuth
// normal, acá no va `redirect_uri` — el popup no redirige a ningún lado.
//
// Lo que devuelve no es un token de usuario como el de la consola, que caduca a
// las 24h: es un token de sistema del negocio.
//
// **Pero caduca igual.** La plantilla de Embedded Signup que usamos emite
// tokens de 60 días, así que esto no es "conectar y olvidarse": a los dos meses
// el número deja de andar y el cliente ve que no le entra nada, sin ningún
// error de por medio. Falta el camino de renovación — hoy la única salida es
// que el cliente vuelva a apretar "Conectar WhatsApp".
export async function exchangeCode(code) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('Faltan META_APP_ID y META_APP_SECRET en el .env del server')
  }

  const params = new URLSearchParams({ client_id: appId, client_secret: appSecret, code })
  const data = await graph(`${GRAPH}/oauth/access_token?${params}`)

  if (!data?.access_token) throw new Error('Meta no devolvió un token al canjear el código')
  return data.access_token
}

// Paso 2: suscribir nuestra app al WABA del cliente.
//
// Sin esto el número queda conectado pero **mudo hacia nosotros**: Meta no nos
// manda ningún webhook y los mensajes del cliente no llegan nunca. Es el paso
// que más se olvida porque no da error visible: todo "anda", pero la bandeja
// queda vacía para siempre.
export async function subscribeApp(wabaId, accessToken) {
  await graph(`${GRAPH}/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// Paso 3: registrar el número para Cloud API.
//
// El PIN es el segundo factor del número. Lo elegimos nosotros y tiene que ser
// el mismo siempre: si el cliente algún día activa la verificación en dos pasos
// por su cuenta, este registro va a fallar hasta que lo desactive.
export async function registerPhoneNumber(phoneNumberId, accessToken) {
  const pin = process.env.WA_REGISTER_PIN
  if (!pin) throw new Error('Falta WA_REGISTER_PIN en el .env del server')

  await graph(`${GRAPH}/${phoneNumberId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
  })
}

// Datos para mostrar de qué número estamos hablando. Sirve de verificación de
// que el token quedó bien: si esto responde, el token sirve de verdad.
export async function getPhoneNumberInfo(phoneNumberId, accessToken) {
  return graph(`${GRAPH}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// El flujo completo, en el orden que importa.
//
// Devuelve `avisos`: cosas que fallaron pero no invalidan la conexión. El caso
// típico es un número que ya estaba registrado de antes — el token y la
// suscripción quedaron bien y el cliente puede operar, así que abortar todo por
// eso sería tirar una conexión buena.
export async function connectWhatsappAccount({ code, wabaId, phoneNumberId }) {
  if (!code) throw new Error('Falta el código de autorización')
  if (!wabaId || !phoneNumberId) throw new Error('Faltan el waba_id o el phone_number_id')

  const accessToken = await exchangeCode(code)
  const avisos = []

  // La suscripción sí es crítica: sin webhooks el CRM no recibe nada y el
  // cliente ve una bandeja vacía sin entender por qué.
  await subscribeApp(wabaId, accessToken)

  try {
    await registerPhoneNumber(phoneNumberId, accessToken)
  } catch (err) {
    console.warn('[onboarding] no se pudo registrar el número:', err.message)
    avisos.push(`El número no se pudo registrar (${err.message}). Puede que ya estuviera registrado.`)
  }

  let info = null
  try {
    info = await getPhoneNumberInfo(phoneNumberId, accessToken)
  } catch (err) {
    console.warn('[onboarding] no se pudo leer el número:', err.message)
    avisos.push('El número quedó conectado pero no se pudieron leer sus datos.')
  }

  return { accessToken, wabaId, phoneNumberId, info, avisos }
}
