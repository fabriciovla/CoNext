import { getWhatsappCredentials } from './tenantsService.js'

// Las plantillas de mensaje ("message templates") son lo único con lo que se le
// puede escribir primero a alguien: fuera de la ventana de 24h que abre el
// cliente al escribirnos, Meta rechaza cualquier texto libre. Por eso esto no
// es una pantalla más — es la mitad de lo que un negocio quiere hacer (avisar
// que salió el pedido, recordar un turno) y hasta ahora el CRM no podía.
//
// A diferencia de todo lo demás, **esto no se guarda en nuestra base**: las
// plantillas viven en la WABA del cliente, las aprueba o rechaza Meta y el
// estado cambia solo. Una copia local sería una copia desactualizada de algo
// cuya única fuente de verdad es Graph, así que se leen en vivo cada vez.
const GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v25.0'

// Las categorías que acepta Meta. AUTHENTICATION queda afuera a propósito: son
// las de código de un solo uso, tienen su propio formato de botones y su propia
// tarifa, y no es lo que un CRM de ventas manda.
export const CATEGORIAS = ['MARKETING', 'UTILITY']

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path}`
}

// Un error de Graph viene con su propia estructura y un mensaje que a veces es
// útil. Se propaga ese texto en vez de un "falló": cuando Meta rechaza una
// plantilla, el motivo es lo único que sirve para arreglarla.
async function pedirAGraph(url, opciones, queHacia) {
  const res = await fetch(url, opciones)
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const detalle = data?.error?.error_user_msg || data?.error?.message || `HTTP ${res.status}`
    const err = new Error(`${queHacia}: ${detalle}`)
    err.status = res.status === 400 ? 400 : 502
    err.metaCode = data?.error?.code ?? null
    throw err
  }

  return data
}

// El cliente todavía no conectó su WhatsApp, o lo conectó cuando el alta no
// guardaba el waba_id. Sin eso no hay a qué WABA pedirle las plantillas, y el
// mensaje tiene que decir eso y no "no autorizado".
function exigirWaba(creds) {
  if (!creds) {
    const err = new Error('Este negocio todavía no conectó su WhatsApp')
    err.status = 409
    throw err
  }
  if (!creds.wabaId) {
    const err = new Error(
      'La conexión de WhatsApp no tiene guardada la cuenta (WABA). Volvé a conectar el número.',
    )
    err.status = 409
    throw err
  }
  return creds
}

// Graph devuelve mucho más de lo que la pantalla usa, y con nombres en snake.
// Se traduce acá para que el frontend reciba lo mismo que en el resto de la API.
function mapPlantilla(fila) {
  const cuerpo = fila.components?.find((c) => c.type === 'BODY')
  const encabezado = fila.components?.find((c) => c.type === 'HEADER')
  const pie = fila.components?.find((c) => c.type === 'FOOTER')

  return {
    id: fila.id,
    name: fila.name,
    status: fila.status,
    category: fila.category,
    language: fila.language,
    body: cuerpo?.text ?? '',
    header: encabezado?.format === 'TEXT' ? (encabezado.text ?? '') : '',
    footer: pie?.text ?? '',
    // Meta solo lo manda cuando rechaza. Es el único texto que explica por qué.
    rejectedReason: fila.rejected_reason ?? null,
  }
}

export async function listTemplates(tenantId) {
  const creds = await getWhatsappCredentials(tenantId)

  // Sin credenciales no se puede listar, pero tampoco es un error: es un cliente
  // que todavía no conectó nada. La pantalla lo dice y ofrece conectar.
  if (!creds?.wabaId) return { conectado: false, templates: [] }

  const data = await pedirAGraph(
    graphUrl(`${creds.wabaId}/message_templates?limit=100`),
    { headers: { Authorization: `Bearer ${creds.accessToken}` } },
    'No se pudieron traer las plantillas',
  )

  return { conectado: true, templates: (data.data ?? []).map(mapPlantilla) }
}

// El nombre lo valida Meta y su regla es angosta: minúsculas, números y guión
// bajo. Se normaliza acá para que escribir "Pedido enviado" no rebote con un
// error de Graph que no explica cuál era el formato.
export function normalizeName(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 512)
}

// Las variables van numeradas y en orden: {{1}}, {{2}}… Si el cuerpo salta del
// {{1}} al {{3}}, Meta rechaza la plantilla sin decir por qué, así que se corta
// acá donde se puede explicar.
function validarVariables(body) {
  const encontradas = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))
  if (encontradas.length === 0) return null

  const esperado = [...new Set(encontradas)].sort((a, b) => a - b)
  for (let i = 0; i < esperado.length; i += 1) {
    if (esperado[i] !== i + 1) {
      return `Las variables tienen que ir numeradas desde {{1}} y sin saltos. Encontré {{${esperado[i]}}} donde iba {{${i + 1}}}.`
    }
  }
  return null
}

export async function createTemplate(tenantId, { name, category, language, body, footer, example }) {
  const nombre = normalizeName(name)
  const cuerpo = String(body ?? '').trim()
  const categoria = String(category ?? '').toUpperCase()

  // Lo que se puede revisar sin salir de acá va primero: son errores de lo que
  // la persona escribió y se contestan igual esté o no conectado el WhatsApp.
  if (!nombre) return { error: 'El nombre no puede quedar vacío' }
  if (!cuerpo) return { error: 'El cuerpo no puede quedar vacío' }
  if (!CATEGORIAS.includes(categoria)) {
    return { error: `La categoría tiene que ser una de: ${CATEGORIAS.join(', ')}` }
  }

  const problema = validarVariables(cuerpo)
  if (problema) return { error: problema }

  const creds = exigirWaba(await getWhatsappCredentials(tenantId))

  const componentes = [{ type: 'BODY', text: cuerpo }]

  // Meta exige un ejemplo por cada variable: sin eso rechaza la plantilla
  // ("missing example"). Si la pantalla no mandó ejemplos, se arma uno con el
  // número de la variable, que es feo pero pasa la revisión.
  const variables = [...new Set([...cuerpo.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])))]
  if (variables.length > 0) {
    const ejemplos = variables
      .sort((a, b) => a - b)
      .map((n, i) => String(example?.[i] ?? '').trim() || `ejemplo ${n}`)
    componentes[0].example = { body_text: [ejemplos] }
  }

  const pieDePagina = String(footer ?? '').trim()
  if (pieDePagina) componentes.push({ type: 'FOOTER', text: pieDePagina })

  const data = await pedirAGraph(
    graphUrl(`${creds.wabaId}/message_templates`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: nombre,
        category: categoria,
        language: language || 'es_AR',
        components: componentes,
      }),
    },
    'Meta rechazó la plantilla',
  )

  // La plantilla nace en PENDING y Meta la revisa aparte; el id es lo único que
  // devuelve al crearla.
  return {
    template: {
      id: data.id,
      name: nombre,
      status: data.status ?? 'PENDING',
      category: data.category ?? categoria,
      language: language || 'es_AR',
      body: cuerpo,
      footer: pieDePagina,
      header: '',
      rejectedReason: null,
    },
  }
}

// Se borra por nombre y no por id: Graph borra *todos* los idiomas de esa
// plantilla, que es lo que la consola de Meta llama eliminar.
export async function deleteTemplate(tenantId, name) {
  const creds = exigirWaba(await getWhatsappCredentials(tenantId))
  const nombre = String(name ?? '').trim()
  if (!nombre) return { error: 'Falta el nombre de la plantilla' }

  await pedirAGraph(
    graphUrl(`${creds.wabaId}/message_templates?name=${encodeURIComponent(nombre)}`),
    { method: 'DELETE', headers: { Authorization: `Bearer ${creds.accessToken}` } },
    'No se pudo borrar la plantilla',
  )

  return { deleted: true }
}
