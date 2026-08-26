import express from 'express'
import cors from 'cors'
import messagesRouter from './routes/messages.js'
import daysRouter from './routes/days.js'
import productsRouter from './routes/products.js'
import settingsRouter from './routes/settings.js'
import conversationsRouter from './routes/conversations.js'
import agentsRouter from './routes/agents.js'
import quickRepliesRouter from './routes/quickReplies.js'
import onboardingRouter from './routes/onboarding.js'
import membersRouter from './routes/members.js'
import webhooksRouter from './routes/webhooks.js'
import devRouter from './routes/dev.js'
import { errorHandler } from './middleware/errorHandler.js'
import { resolveTenant } from './middleware/resolveTenant.js'

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

  // Los webhooks van antes de la resolución de tenant: los firma Meta, no
  // nosotros, y no pueden mandar una API key. Resuelven su propio cliente por
  // el phone_number_id del payload.
  app.use('/webhooks', webhooksRouter)

  // De acá para abajo, todo exige API key y todo queda scopeado a req.tenant.
  app.use(resolveTenant)

  app.use('/messages', messagesRouter)
  app.use('/days', daysRouter)
  app.use('/products', productsRouter)
  app.use('/settings', settingsRouter)
  app.use('/conversations', conversationsRouter)
  app.use('/agents', agentsRouter)
  app.use('/quick-replies', quickRepliesRouter)
  app.use('/members', membersRouter)
  // Va después de resolveTenant: el cliente ya está adentro de su dashboard y
  // el número que conecta se ata a *su* tenant. Es el único dato de la cuenta
  // de Meta que el CRM escribe desde la UI.
  app.use('/onboarding', onboardingRouter)

  if (process.env.NODE_ENV !== 'production') {
    app.use('/dev', devRouter)
  }

  app.use(errorHandler)

  return app
}
