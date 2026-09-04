// El perfil del negocio en WhatsApp: la foto, la descripción, la dirección y
// los datos de contacto que ve el cliente al abrir el chat.
//
// Existe porque migrar un número a la Cloud API apaga la app WhatsApp Business
// del celular, que es donde el dueño editaba todo esto. Sin esta pantalla, el
// costo de pasarse al CRM incluye perder el perfil y no poder volver a tocarlo.
//
// No se guarda nada de esto en nuestra base: la fuente de verdad es Meta, igual
// que con las plantillas. Una copia local sería una copia desactualizada de algo
// que el dueño también puede cambiar desde el Business Manager.

const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`

// Los campos hay que pedirlos por nombre: sin `fields`, Graph devuelve el
// perfil casi vacío y la pantalla se dibujaría en blanco sobre un perfil lleno.
const CAMPOS = 'about,address,description,email,profile_picture_url,vertical,websites'

// El rubro es una lista cerrada de Meta y no un texto libre. Se valida acá
// porque el error de Graph por un valor de más no dice cuáles eran los válidos.
export const RUBROS = [
  'UNDEFINED', 'OTHER', 'AUTO', 'BEAUTY', 'APPAREL', 'EDU', 'ENTERTAIN',
  'EVENT_PLAN', 'FINANCE', 'GROCERY', 'GOVT', 'HOTEL', 'HEALTH', 'NONPROFIT',
  'PROF_SERVICES', 'RETAIL', 'TRAVEL', 'RESTAURANT', 'NOT_A_BIZ',
]

// Topes de Meta. Se cortan de este lado por el mismo criterio que las
// plantillas: es un error de lo que la persona escribió, se contesta sin salir
// del server y no depende de que el token esté vigente.
const LIMITES = { about: 139, address: 256, description: 512, email: 128 }
const MAX_SITIOS = 2

// La foto tiene mínimo además de máximo: Meta rechaza cualquier cosa por debajo
// de 192x192, y un logo chico es justo lo que alguien va a intentar subir.
const FOTO_MIMES = ['image/jpeg', 'image/png']
const FOTO_MAX_BYTES = 5 * 1024 * 1024

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

export async function getPerfil(phoneNumberId, accessToken) {
  const data = await graph(`${GRAPH}/${phoneNumberId}/whatsapp_business_profile?fields=${CAMPOS}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // Graph lo devuelve envuelto en un array de un elemento. Sin desarmarlo acá,
  // cada consumidor tendría que saber esa forma.
  const perfil = data?.data?.[0] ?? {}
  return {
    about: perfil.about ?? '',
    address: perfil.address ?? '',
    description: perfil.description ?? '',
    email: perfil.email ?? '',
    vertical: perfil.vertical ?? '',
    websites: perfil.websites ?? [],
    profilePictureUrl: perfil.profile_picture_url ?? null,
  }
}

// Devuelve el mensaje del primer campo que no pasa, o null. Va antes de pedir
// las credenciales por el mismo motivo que en plantillas.
export function validarPerfil(campos) {
  for (const [campo, tope] of Object.entries(LIMITES)) {
    const valor = campos[campo]
    if (typeof valor === 'string' && valor.length > tope) {
      return `El campo "${campo}" supera los ${tope} caracteres que acepta WhatsApp`
    }
  }

  if (campos.vertical && !RUBROS.includes(campos.vertical)) {
    return `Rubro desconocido: ${campos.vertical}`
  }

  if (campos.websites) {
    if (!Array.isArray(campos.websites)) return 'Los sitios web tienen que venir como lista'
    if (campos.websites.length > MAX_SITIOS) {
      return `WhatsApp acepta hasta ${MAX_SITIOS} sitios web`
    }
    for (const sitio of campos.websites) {
      if (!/^https?:\/\//i.test(sitio)) {
        return `El sitio "${sitio}" tiene que empezar con http:// o https://`
      }
    }
  }

  if (campos.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campos.email)) {
    return 'El correo no tiene un formato válido'
  }

  return null
}

// Meta pisa solo lo que se le manda, así que un campo ausente queda como
// estaba. Se mandan igual los vacíos: borrar la descripción es un cambio tan
// legítimo como escribirla, y omitirlos haría que nunca se pueda vaciar nada.
export async function actualizarPerfil(phoneNumberId, accessToken, campos) {
  const body = { messaging_product: 'whatsapp' }
  for (const campo of ['about', 'address', 'description', 'email', 'vertical']) {
    if (campos[campo] !== undefined) body[campo] = campos[campo]
  }
  if (campos.websites !== undefined) body.websites = campos.websites

  await graph(`${GRAPH}/${phoneNumberId}/whatsapp_business_profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return getPerfil(phoneNumberId, accessToken)
}

// La foto es el único campo que no se manda como texto: hay que subir el
// binario a la Resumable Upload API, que devuelve un "handle", y recién
// entonces guardar ese handle en el perfil. Son tres llamadas, no una.
//
// La sesión de subida cuelga del APP_ID y no del número: es una subida de la
// app, no del cliente. El token sí es el del cliente.
export async function subirFotoPerfil(phoneNumberId, accessToken, archivo) {
  if (!FOTO_MIMES.includes(archivo.mimetype)) {
    throw new Error('La foto tiene que ser JPG o PNG')
  }
  if (archivo.size > FOTO_MAX_BYTES) {
    throw new Error('La foto supera los 5 MB')
  }

  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('Falta META_APP_ID en el .env del server')

  const params = new URLSearchParams({
    file_name: archivo.originalname || 'perfil',
    file_length: String(archivo.size),
    file_type: archivo.mimetype,
    access_token: accessToken,
  })
  const sesion = await graph(`${GRAPH}/${appId}/uploads?${params}`, { method: 'POST' })
  if (!sesion?.id) throw new Error('Meta no devolvió una sesión de subida')

  // El segundo paso va con `Authorization: OAuth` y no `Bearer`: es la única
  // llamada de Graph que usa ese esquema, y con Bearer contesta un 400 que no
  // explica nada.
  const subida = await graph(`${GRAPH}/${sesion.id}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${accessToken}`,
      file_offset: '0',
      'Content-Type': archivo.mimetype,
    },
    body: archivo.buffer,
  })
  if (!subida?.h) throw new Error('Meta no devolvió el identificador de la foto')

  await graph(`${GRAPH}/${phoneNumberId}/whatsapp_business_profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', profile_picture_handle: subida.h }),
  })

  return getPerfil(phoneNumberId, accessToken)
}
