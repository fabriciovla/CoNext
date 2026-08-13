import { Router } from 'express'
import { handleIncomingMessage } from '../services/conversationService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// Lets you exercise the full incoming-message pipeline (classify -> auto-send
// or draft) without real Meta credentials. Mounted only outside production.
// El tenant sale de la API key igual que en el resto de la API: así lo que se
// simula es un mensaje entrante *de ese cliente*, no uno huérfano.
router.post(
  '/simulate-incoming',
  ah(async (req, res) => {
    const { phone, channel = 'whatsapp', text, customerName } = req.body
    if (!phone || !text) {
      return res.status(400).json({ error: 'phone y text son obligatorios' })
    }
    const result = await handleIncomingMessage(req.tenantId, { phone, channel, text, customerName })
    res.status(201).json(result)
  }),
)

export default router
