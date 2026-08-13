import { getTenantByApiKey } from '../services/tenantsService.js'

// Reemplaza a requireApiKey, que comparaba contra una única clave compartida en
// el .env. Con varios clientes esa clave ya no alcanza: no solo autentica, ahora
// tiene que decir *quién* es — cada tenant tiene la suya y de ahí sale req.tenant.
//
// Todo lo que hay debajo de este middleware lee y escribe scopeado a req.tenant.
// No hay ninguna ruta que trabaje "sin tenant": si la resolución falla, la
// request muere acá y no llega a tocar la base.
//
// Cuando exista login de verdad, el reemplazo es local: la sesión resuelve al
// mismo req.tenant y el resto del server no se entera. Por eso el resto del
// código nunca lee la clave — lee req.tenant.
export async function resolveTenant(req, res, next) {
  const apiKey = req.get('x-api-key') ?? ''

  if (!apiKey) {
    return res.status(401).json({ error: 'Falta la API key' })
  }

  try {
    const tenant = await getTenantByApiKey(apiKey)
    if (!tenant) {
      // Mismo mensaje para clave inválida y para cliente suspendido: distinguir
      // los casos le confirmaría a un tercero qué claves existen.
      return res.status(401).json({ error: 'No autorizado' })
    }

    req.tenant = tenant
    req.tenantId = tenant.id
    next()
  } catch (err) {
    next(err)
  }
}
