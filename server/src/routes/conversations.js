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
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// Static sub-paths before the `:phone` param route so they aren't swallowed by it.
router.get(
  '/drafts',
  ah(async (req, res) => {
    res.json(await getOpenDrafts(req.tenantId))
  }),
)

router.get(
  '/meta',
  ah(async (req, res) => {
    res.json(await getConversationsMeta(req.tenantId))
  }),
)

router.patch(
  '/:phone/resolve',
  ah(async (req, res) => {
    res.json(await resolveConversation(req.tenantId, req.params.phone))
  }),
)

router.patch(
  '/:phone/assignee',
  ah(async (req, res) => {
    res.json(await setAssignee(req.tenantId, req.params.phone, req.body.assignee ?? null))
  }),
)

router.patch(
  '/:phone/agent',
  ah(async (req, res) => {
    const updated = await setConversationAgent(req.tenantId, req.params.phone, req.body.agent)
    if (!updated) return res.status(404).json({ error: 'Agente no encontrado' })
    res.json(updated)
  }),
)

router.post(
  '/:phone/tags',
  ah(async (req, res) => {
    const tags = await addConversationTag(req.tenantId, req.params.phone, req.body.tag)
    if (!tags) return res.status(400).json({ error: 'Etiqueta vacía o conversación inexistente' })
    res.status(201).json(tags)
  }),
)

// La etiqueta va en la URL, así que puede traer espacios o acentos: Express ya
// la entrega decodificada en req.params.
router.delete(
  '/:phone/tags/:tag',
  ah(async (req, res) => {
    res.json(await removeConversationTag(req.tenantId, req.params.phone, req.params.tag))
  }),
)

router.post(
  '/:phone/notes',
  ah(async (req, res) => {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'text es obligatorio' })
    res.status(201).json(await addNote(req.tenantId, req.params.phone, text.trim()))
  }),
)

router.post(
  '/:phone/draft/discard',
  ah(async (req, res) => {
    await discardDraft(req.tenantId, req.params.phone)
    res.status(204).end()
  }),
)

export default router
