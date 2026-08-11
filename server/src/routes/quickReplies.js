import { Router } from 'express'
import {
  getQuickReplies,
  addQuickReply,
  updateQuickReply,
  deleteQuickReply,
} from '../services/quickRepliesService.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(getQuickReplies())
})

router.post('/', (req, res) => {
  const { shortcut, text } = req.body
  if (!shortcut?.trim() || !text?.trim()) {
    return res.status(400).json({ error: 'shortcut y text son obligatorios' })
  }
  const created = addQuickReply({ shortcut, text })
  if (!created) return res.status(400).json({ error: 'El atajo o el texto quedaron vacíos' })
  res.status(201).json(created)
})

router.put('/:id', (req, res) => {
  const updated = updateQuickReply(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Respuesta rápida no encontrada' })
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  deleteQuickReply(req.params.id)
  res.status(204).end()
})

export default router
