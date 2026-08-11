import { Router } from 'express'
import {
  getAgents,
  addAgent,
  updateAgent,
  deleteAgent,
  reorderAgents,
  getAgentStats,
} from '../services/agentsService.js'

const router = Router()

// Antes de la ruta con `:id` para que no se la coma el parámetro.
router.get('/stats', (req, res) => {
  res.json(getAgentStats())
})

router.get('/', (req, res) => {
  res.json(getAgents())
})

router.post('/', (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name es obligatorio' })
  res.status(201).json(addAgent({ ...req.body, name: name.trim() }))
})

router.post('/reorder', (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids debe ser un array' })
  res.json(reorderAgents(ids))
})

router.put('/:id', (req, res) => {
  if ('name' in req.body && !req.body.name?.trim()) {
    return res.status(400).json({ error: 'name no puede quedar vacío' })
  }
  const updated = updateAgent(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Agente no encontrado' })
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const { deleted, reason } = deleteAgent(req.params.id)
  if (deleted) return res.status(204).end()
  if (reason === 'not-found') return res.status(404).json({ error: 'Agente no encontrado' })
  return res.status(409).json({ error: 'Tiene que quedar al menos un agente' })
})

export default router
