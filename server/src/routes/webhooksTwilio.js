import { Router, urlencoded } from 'express'
import db from '../db/index.js'
import { verifyTwilioSignature } from '../middleware/verifyTwilioSignature.js'
import { handleIncomingMessage } from '../services/conversationService.js'

const router = Router()

// Twilio posts application/x-www-form-urlencoded, not JSON — scoped here so
// it doesn't affect the express.json() used by the rest of the API.
router.use(urlencoded({ extended: false }))

router.post('/', verifyTwilioSignature, async (req, res) => {
  // Ack immediately — same reasoning as the Meta webhook: classification/send
  // happens async after Twilio already has its 200.
  res.type('text/xml').send('<Response></Response>')

  const { From, Body, ProfileName, MessageSid } = req.body
  if (!From || !Body) return

  const phone = From.replace(/^whatsapp:/, '')
  const externalId = MessageSid

  if (externalId) {
    const seen = db.prepare('SELECT id FROM webhook_events WHERE id = ?').get(externalId)
    if (seen) return
    db.prepare('INSERT INTO webhook_events (id, received_at) VALUES (?, ?)').run(externalId, new Date().toISOString())
  }

  try {
    await handleIncomingMessage({
      phone,
      channel: 'whatsapp',
      text: Body,
      customerName: ProfileName || phone,
      externalId,
    })
  } catch (err) {
    console.error('[webhooks/twilio] failed to process incoming message:', err)
  }
})

export default router
