import express from 'express'
import cors from 'cors'
import messagesRouter from './routes/messages.js'
import daysRouter from './routes/days.js'
import productsRouter from './routes/products.js'
import settingsRouter from './routes/settings.js'
import conversationsRouter from './routes/conversations.js'
import agentsRouter from './routes/agents.js'
import quickRepliesRouter from './routes/quickReplies.js'
import webhooksRouter from './routes/webhooks.js'
import webhooksTwilioRouter from './routes/webhooksTwilio.js'
import devRouter from './routes/dev.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requireApiKey } from './middleware/requireApiKey.js'

export function createApp() {
  const app = express()

  app.use(cors())
  // Capture the raw body alongside the parsed one: verifyMetaSignature needs
  // the exact bytes Meta signed, which the parsed req.body can't reproduce.
  app.use(
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf
      },
    }),
  )

  // Los webhooks van antes de la API key: los firma el proveedor, no nosotros.
  app.use('/webhooks', webhooksRouter)
  app.use('/webhooks/twilio', webhooksTwilioRouter)

  // De acá para abajo, todo pide la key.
  app.use(requireApiKey)

  app.use('/messages', messagesRouter)
  app.use('/days', daysRouter)
  app.use('/products', productsRouter)
  app.use('/settings', settingsRouter)
  app.use('/conversations', conversationsRouter)
  app.use('/agents', agentsRouter)
  app.use('/quick-replies', quickRepliesRouter)

  if (process.env.NODE_ENV !== 'production') {
    app.use('/dev', devRouter)
  }

  app.use(errorHandler)

  return app
}
