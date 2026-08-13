import { Router } from 'express'
import {
  getAgents,
  addAgent,
  updateAgent,
  deleteAgent,
  reorderAgents,
  getAgentStats,
} from '../services/agentsService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// Antes de la ruta con `:id` para que no se la coma el parámetro.
router.get(
  '/stats',
  ah(async (req, res) => {
    res.json(await getAgentStats(req.tenantId))
  }),
)

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getAgents(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name es obligatorio' })
    res.status(201).json(await addAgent(req.tenantId, { ...req.body, name: name.trim() }))
  }),
)

router.post(
  '/reorder',
  ah(async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids debe ser un array' })
    res.json(await reorderAgents(req.tenantId, ids))
  }),
)

router.put(
  '/:id',
  ah(async (req, res) => {
    if ('name' in req.body && !req.body.name?.trim()) {
      return res.status(400).json({ error: 'name no puede quedar vacío' })
    }
    const updated = await updateAgent(req.tenantId, req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Agente no encontrado' })
    res.json(updated)
  }),
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    const { deleted, reason } = await deleteAgent(req.tenantId, req.params.id)
    if (deleted) return res.status(204).end()
    if (reason === 'not-found') return res.status(404).json({ error: 'Agente no encontrado' })
    return res.status(409).json({ error: 'Tiene que quedar al menos un agente' })
  }),
)

export default router
