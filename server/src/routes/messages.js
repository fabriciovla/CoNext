import { Router } from 'express'
import { getOpenMessages, getMessagesForDay } from '../services/dayService.js'
import { sendOutboundMessage } from '../services/conversationService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    const { day } = req.query
    if (!day || day === 'open') return res.json(await getOpenMessages(req.tenantId))
    res.json(await getMessagesForDay(req.tenantId, day))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { phone, text } = req.body
    if (!phone || !text?.trim()) {
      return res.status(400).json({ error: 'phone y text son obligatorios' })
    }
    const message = await sendOutboundMessage(req.tenantId, phone, text.trim(), 'admin')
    res.status(201).json(message)
  }),
)

export default router
