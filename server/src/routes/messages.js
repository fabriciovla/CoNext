import { Router } from 'express'
import { getOpenMessages, getMessagesForDay } from '../services/dayService.js'
import { sendOutboundMessage } from '../services/conversationService.js'

const router = Router()

router.get('/', (req, res) => {
  const { day } = req.query
  if (!day || day === 'open') return res.json(getOpenMessages())
  res.json(getMessagesForDay(day))
})

router.post('/', async (req, res, next) => {
  try {
    const { phone, text } = req.body
    if (!phone || !text?.trim()) {
      return res.status(400).json({ error: 'phone y text son obligatorios' })
    }
    const message = await sendOutboundMessage(phone, text.trim(), 'admin')
    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

export default router
