import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { listTemplates, createTemplate, deleteTemplate } from '../services/templatesService.js'

const router = Router()

// Las plantillas no viven en nuestra base: son de la WABA del cliente y la
// fuente de verdad es Graph. Estas tres rutas son un pasamanos con el tenant
// puesto — lo único nuestro es de quién es el token que se usa.
router.get(
  '/',
  ah(async (req, res) => {
    res.json(await listTemplates(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { name, category, language, body, footer, example } = req.body
    const resultado = await createTemplate(req.tenantId, {
      name,
      category,
      language,
      body,
      footer,
      example,
    })
    if (resultado.error) return res.status(400).json({ error: resultado.error })
    res.status(201).json(resultado.template)
  }),
)

router.delete(
  '/:name',
  ah(async (req, res) => {
    const resultado = await deleteTemplate(req.tenantId, req.params.name)
    if (resultado.error) return res.status(400).json({ error: resultado.error })
    res.status(204).end()
  }),
)

export default router
