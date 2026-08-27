import { Router } from 'express'

const router = Router()

// Va después de resolveTenant, así que llegar acá ya significa que la sesión
// vale. Devuelve el negocio en el que se está trabajando y la lista completa
// para quien pertenece a más de uno (el header x-tenant-id elige).
//
// Con API key no hay persona: `user` viene en null y la dashboard sabe que está
// mirando por la puerta de servicio, no por la de una cuenta.
router.get('/', (req, res) => {
  res.json({
    user: req.user ?? null,
    role: req.role ?? null,
    tenant: req.tenant,
    tenants: req.tenants ?? [req.tenant],
  })
})

export default router
