import { Router } from 'express'
import {
  resolveConversation,
  addNote,
  setAssignee,
  getOpenDrafts,
  discardDraft,
  getConversationsMeta,
  setConversationAgent,
  addConversationTag,
  removeConversationTag,
} from '../services/conversationService.js'

const router = Router()

// Static sub-paths before the `:phone` param route so they aren't swallowed by it.
router.get('/drafts', (req, res) => {
  res.json(getOpenDrafts())
})

router.get('/meta', (req, res) => {
  res.json(getConversationsMeta())
})

router.patch('/:phone/resolve', (req, res) => {
  res.json(resolveConversation(req.params.phone))
})

router.patch('/:phone/assignee', (req, res) => {
  res.json(setAssignee(req.params.phone, req.body.assignee ?? null))
})

router.patch('/:phone/agent', (req, res) => {
  const updated = setConversationAgent(req.params.phone, req.body.agent)
  if (!updated) return res.status(404).json({ error: 'Agente no encontrado' })
  res.json(updated)
})

router.post('/:phone/tags', (req, res) => {
  const tags = addConversationTag(req.params.phone, req.body.tag)
  if (!tags) return res.status(400).json({ error: 'Etiqueta vacía o conversación inexistente' })
  res.status(201).json(tags)
})

// La etiqueta va en la URL, así que puede traer espacios o acentos: Express ya
// la entrega decodificada en req.params.
router.delete('/:phone/tags/:tag', (req, res) => {
  res.json(removeConversationTag(req.params.phone, req.params.tag))
})

router.post('/:phone/notes', (req, res, next) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'text es obligatorio' })
    res.status(201).json(addNote(req.params.phone, text.trim()))
  } catch (err) {
    next(err)
  }
})

router.post('/:phone/draft/discard', (req, res) => {
  discardDraft(req.params.phone)
  res.status(204).end()
})

export default router
