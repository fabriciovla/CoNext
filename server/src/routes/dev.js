import { Router } from 'express'
import { handleIncomingMessage } from '../services/conversationService.js'

const router = Router()

// Lets you exercise the full incoming-message pipeline (classify -> auto-send
// or draft) without real Meta credentials. Mounted only outside production.
router.post('/simulate-incoming', async (req, res, next) => {
  try {
    const { phone, channel = 'whatsapp', text, customerName } = req.body
    if (!phone || !text) {
      return res.status(400).json({ error: 'phone y text son obligatorios' })
    }
    const result = await handleIncomingMessage({ phone, channel, text, customerName })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

export default router
