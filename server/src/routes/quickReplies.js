import { Router } from 'express'
import {
  getQuickReplies,
  addQuickReply,
  updateQuickReply,
  deleteQuickReply,
} from '../services/quickRepliesService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getQuickReplies(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { shortcut, text } = req.body
    if (!shortcut?.trim() || !text?.trim()) {
      return res.status(400).json({ error: 'shortcut y text son obligatorios' })
    }
    const created = await addQuickReply(req.tenantId, { shortcut, text })
    if (!created) return res.status(400).json({ error: 'El atajo o el texto quedaron vacíos' })
    res.status(201).json(created)
  }),
)

router.put(
  '/:id',
  ah(async (req, res) => {
    const updated = await updateQuickReply(req.tenantId, req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Respuesta rápida no encontrada' })
    res.json(updated)
  }),
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    await deleteQuickReply(req.tenantId, req.params.id)
    res.status(204).end()
  }),
)

export default router
