import { run, many } from '../db/index.js'

// Los eventos que nos importan del ciclo de vida de una suscripción. El resto
// (disputas, reembolsos, licencias) se guarda igual pero no dispara nada: la
// tabla es el registro de lo que Dodo dijo, no solo de lo que sabemos atender.
export const EVENTOS_ALTA = new Set(['subscription.active', 'payment.succeeded'])
export const EVENTOS_BAJA = new Set([
  'subscription.cancelled',
  'subscription.expired',
  'subscription.failed',
  'subscription.on_hold',
])

const PLANES = new Set(['gratis', 'estandar', 'premium'])

function texto(valor, tope = 200) {
  if (valor == null) return null
  const s = String(valor).trim()
  if (!s) return null
  return s.slice(0, tope)
}

// El plan viaja en la metadata que le pone `dodoCheckout` a la URL
// (`metadata_plan`). Es lo único que ata el pago a uno de nuestros planes sin
// tener que mapear product_id a mano en dos lugares — pero llega del navegador,
// así que se valida contra la lista y si no cierra queda null antes que mal.
function extraerPlan(data) {
  const crudo = texto(data?.metadata?.plan ?? data?.metadata?.metadata_plan)
  if (!crudo) return null
  const normalizado = crudo.toLowerCase()
  return PLANES.has(normalizado) ? normalizado : null
}

// Dodo anida distinto según el tipo de evento (Subscription trae
// subscription_id, Payment trae payment_id y a veces los dos), así que se lee
// todo con optional chaining y lo que no esté queda null.
export function aplanarEvento(body) {
  const data = body?.data ?? {}
  const cliente = data.customer ?? {}

  return {
    tipo: texto(body?.type) ?? 'desconocido',
    plan: extraerPlan(data),
    email: texto(cliente.email),
    nombre: texto(cliente.name),
    customerId: texto(cliente.customer_id),
    subscriptionId: texto(data.subscription_id),
    paymentId: texto(data.payment_id),
    productId: texto(data.product_id),
    estado: texto(data.status),
  }
}

// Guarda el evento y devuelve si era nuevo. El ON CONFLICT es el dedup: Dodo
// reintenta hasta que contestemos 2xx, y también reenvía a mano desde el
// dashboard, así que el mismo webhook-id puede llegar varias veces. Cero filas
// = ya lo teníamos, y el que llama corta ahí.
export async function guardarEvento(webhookId, body) {
  const campos = aplanarEvento(body)

  const filas = await run(
    `INSERT INTO dodo_eventos (
       id, tipo, plan, email, nombre, customer_id, subscription_id,
       payment_id, product_id, estado, payload, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
     ON CONFLICT (id) DO NOTHING`,
    [
      webhookId,
      campos.tipo,
      campos.plan,
      campos.email,
      campos.nombre,
      campos.customerId,
      campos.subscriptionId,
      campos.paymentId,
      campos.productId,
      campos.estado,
      JSON.stringify(body ?? {}),
      new Date().toISOString(),
    ],
  )

  return { nuevo: filas > 0, ...campos }
}

// La cola de lo que pagó pero todavía no es cliente del CRM. Por ahora se mira
// a mano para dar el alta con `npm run tenant`; cuando el alta se automatice,
// es de acá de donde va a salir.
export async function eventosPendientes(limite = 50) {
  return many(
    `SELECT id, tipo, plan, email, nombre, subscription_id AS "subscriptionId",
            estado, created_at AS "createdAt"
       FROM dodo_eventos
      WHERE tenant_id IS NULL AND tipo = ANY($1)
      ORDER BY created_at DESC
      LIMIT $2`,
    [[...EVENTOS_ALTA], limite],
  )
}

// Ata un evento al cliente que se creó a partir de él. Lo llama el alta, no el
// webhook: es lo que saca al evento de la cola de pendientes.
export async function marcarProcesado(eventoId, tenantId) {
  return run(`UPDATE dodo_eventos SET tenant_id = $1, procesado_at = $2 WHERE id = $3`, [
    tenantId,
    new Date().toISOString(),
    eventoId,
  ])
}
