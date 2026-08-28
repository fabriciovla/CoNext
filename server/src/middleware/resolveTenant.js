import { getTenantByApiKey } from '../services/tenantsService.js'
import { usuarioDeToken, authDisponible } from '../services/supabaseAuth.js'
import { ensureUser, listTenantsForUser } from '../services/membersService.js'
import { provisionarDesdeDodo } from '../services/dodoService.js'

// Reemplaza a requireApiKey, que comparaba contra una única clave compartida en
// el .env. Con varios clientes esa clave ya no alcanza: no solo autentica, ahora
// tiene que decir *quién* es — de acá sale req.tenant.
//
// Todo lo que hay debajo de este middleware lee y escribe scopeado a req.tenant.
// No hay ninguna ruta que trabaje "sin tenant": si la resolución falla, la
// request muere acá y no llega a tocar la base.
//
// Hay dos formas de entrar, y las dos terminan en el mismo req.tenant:
//
//   1. `Authorization: Bearer <token de Supabase>` — una persona en la
//      dashboard. El token se verifica contra Supabase Auth y el cliente sale
//      de `tenant_members`: se ve lo de los negocios donde esa persona es
//      miembro, y nada más. Es el camino de /app publicado, donde no hay proxy
//      de Vite que ponga ninguna clave.
//   2. `x-api-key` — un script o una integración (simulate, seed, curl). No hay
//      persona atrás, así que tampoco hay rol: la clave *es* el cliente.
//
// El orden importa: si vienen las dos, gana la sesión. El proxy de Vite inyecta
// la API key en todas las requests de desarrollo (`vite.config.js`), así que en
// local viajan juntas y lo que tiene que mandar es quién está logueado.
export async function resolveTenant(req, res, next) {
  const bearer = (req.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  const apiKey = req.get('x-api-key') ?? ''

  if (!bearer && !apiKey) {
    return res.status(401).json({ error: 'Falta la sesión' })
  }

  try {
    if (bearer) {
      if (!authDisponible()) {
        return res.status(503).json({
          error: 'El login no está configurado en el server (falta SUPABASE_URL / SUPABASE_ANON_KEY)',
        })
      }

      const cuenta = await usuarioDeToken(bearer)
      if (!cuenta) {
        return res.status(401).json({ error: 'Sesión vencida o inválida' })
      }

      // El perfil se crea al vuelo la primera vez que entra. En Supabase el
      // trigger de `auth.users` ya lo hace, pero acá no se puede dar por hecho:
      // el trigger solo existe si la base es Supabase, y una cuenta creada
      // antes de esa migración nunca pasó por él.
      const { user, error } = await ensureUser({
        id: cuenta.id,
        email: cuenta.email,
        displayName: cuenta.displayName,
      })
      if (error) {
        return res.status(401).json({ error: 'La cuenta no tiene un email válido' })
      }

      const tenants = await listTenantsForUser(user.id)
      let activos = tenants.filter((t) => t.status === 'activo')

      if (activos.length === 0) {
        // Antes de rebotarla: puede ser alguien que acaba de pagar y entra por
        // primera vez. El pago llega por webhook minutos antes de que esta
        // persona exista para nosotros, así que el negocio no se puede haber
        // creado en el momento del cobro — se crea acá, en el primer ingreso.
        const nuevo = await provisionarDesdeDodo(user)
        if (nuevo) {
          activos = await listTenantsForUser(user.id)
        }
      }

      if (activos.length === 0) {
        // Entró bien, pero no es miembro de ningún negocio ni tiene un pago a
        // su nombre. No es un problema de credenciales y por eso no es 401:
        // mandarla a iniciar sesión de nuevo no la acerca a ninguna solución.
        return res.status(403).json({
          error: 'Tu cuenta todavía no está asociada a ningún negocio. Pedile al dueño que te invite.',
          codigo: 'sin-tenant',
        })
      }

      // Quien pertenece a más de un negocio elige con el header; sin header, el
      // primero por antigüedad. Un id que no está en la lista no es un error de
      // la persona: se ignora y entra al que corresponde.
      const pedido = (req.get('x-tenant-id') ?? '').trim()
      const elegido = activos.find((t) => t.id === pedido) ?? activos[0]

      req.tenant = { id: elegido.id, name: elegido.name, slug: elegido.slug, status: elegido.status }
      req.tenantId = elegido.id
      req.user = user
      req.role = elegido.role
      req.tenants = activos
      return next()
    }

    const tenant = await getTenantByApiKey(apiKey)
    if (!tenant) {
      // Mismo mensaje para clave inválida y para cliente suspendido: distinguir
      // los casos le confirmaría a un tercero qué claves existen.
      return res.status(401).json({ error: 'No autorizado' })
    }

    req.tenant = tenant
    req.tenantId = tenant.id
    return next()
  } catch (err) {
    // Supabase sin responder no es una credencial inválida: 503 deja que la
    // dashboard reintente en el próximo poll en vez de mandar a iniciar sesión.
    if (err?.status === 503) {
      return res.status(503).json({ error: err.message })
    }
    return next(err)
  }
}
