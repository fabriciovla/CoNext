import { run, many, one } from '../db/index.js'
import { provisionTenant } from './tenantsService.js'

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

// Reserva el pago sin usar más reciente de ese email y lo devuelve. Es una
// reserva, no una lectura: el UPDATE condicional es lo único que impide que dos
// requests simultáneas de la misma persona provisionen dos negocios. Y son
// simultáneas de verdad — la dashboard dispara cuatro requests cada seis
// segundos, así que la carrera acá es la regla y no el caso raro.
//
// `FOR UPDATE SKIP LOCKED` es para lo mismo un escalón más abajo: si dos
// transacciones eligen la misma fila en el SELECT, la segunda la saltea en vez
// de esperarla y volver a escribirla.
//
// El email es la única llave entre los dos lados: Dodo sabe quién pagó y
// Supabase sabe quién entró, y no comparten ningún otro identificador. Se
// compara en minúscula porque el que escribe el mail en el checkout no es el
// mismo que eligió cómo se ve en Google.
export async function reclamarPagoPendiente(email) {
  if (!email) return undefined

  return one(
    `UPDATE dodo_eventos
        SET procesado_at = $2
      WHERE id = (
        SELECT id FROM dodo_eventos
         WHERE lower(email) = lower($1)
           AND tenant_id IS NULL
           AND procesado_at IS NULL
           AND tipo = ANY($3)
         ORDER BY created_at DESC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING id, plan, nombre, email, subscription_id AS "subscriptionId"`,
    [email, new Date().toISOString(), [...EVENTOS_ALTA]],
  )
}

// Devuelve el evento a la cola. Solo si todavía no se convirtió en un cliente:
// una vez que hay tenant_id, la reserva dejó de ser una reserva y es el registro
// de que el alta se hizo.
export async function liberarPago(eventoId) {
  return run(`UPDATE dodo_eventos SET procesado_at = NULL WHERE id = $1 AND tenant_id IS NULL`, [eventoId])
}

// Dodo nos da el nombre de la persona que pagó, no el del negocio: nadie se lo
// pregunta en el checkout. Se usa ese y se deja que se cambie en Configuración,
// que es un renglón, en vez de trabar el alta detrás de un formulario más
// justo después de haber pagado.
function nombreDeNegocio(evento, user) {
  return evento.nombre?.trim() || user.displayName?.trim() || String(user.email).split('@')[0]
}

// El alta automática. La llama resolveTenant cuando alguien entra con una
// sesión válida y no es miembro de ningún negocio: si pagó, en vez del 403 se
// le arma el cliente en el momento.
//
// Devuelve undefined si no hay ningún pago a su nombre, que es el caso normal
// de alguien a quien todavía no invitaron.
export async function provisionarDesdeDodo(user) {
  const evento = await reclamarPagoPendiente(user.email)
  if (!evento) return undefined

  try {
    const tenant = await provisionTenant({
      name: nombreDeNegocio(evento, user),
      ownerUserId: user.id,
    })
    await marcarProcesado(evento.id, tenant.id)
    console.log(
      `[dodo] alta automática: ${user.email} -> ${tenant.slug} (plan ${evento.plan ?? 'sin identificar'})`,
    )
    return tenant
  } catch (err) {
    // Si el alta falla a mitad de camino, el evento vuelve a la cola: dejarlo
    // reservado lo esconde para siempre y esa persona pagó. Se traga el error
    // de liberar a propósito — el que importa es el de arriba.
    await liberarPago(evento.id).catch(() => {})
    throw err
  }
}
