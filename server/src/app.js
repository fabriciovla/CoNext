import express from 'express'
import cors from 'cors'
import compression from 'compression'
import meRouter from './routes/me.js'
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
import altasRouter from './routes/altas.js'
import { errorHandler } from './middleware/errorHandler.js'
import { resolveTenant } from './middleware/resolveTenant.js'

// Los orígenes que pueden llamar a la API desde un navegador. En desarrollo la
// dashboard vive en el mismo origen (el proxy de Vite) y esto no interviene;
// publicada, la dash está en conext.lat y la API en otro dominio, así que sin
// esta lista el navegador bloquea todo. Vacío = todos, que es lo que quiere
// desarrollo y lo que no puede quedar en producción.
function origenesPermitidos() {
  return String(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function createApp() {
  const app = express()

  // Railway (y cualquier host con proxy adelante) termina el TLS afuera: sin
  // esto, req.ip es el del proxy y req.protocol dice http aunque el visitante
  // haya entrado por https.
  app.set('trust proxy', 1)

  const origenes = origenesPermitidos()
  app.use(
    cors({
      origin(origin, cb) {
        // Sin Origin no hay navegador atrás: curl, los webhooks de Meta, los
        // scripts. CORS no es lo que los autoriza — de eso se ocupa la API key.
        if (!origin || origenes.length === 0) return cb(null, true)
        cb(null, origenes.includes(origin.replace(/\/$/, '')))
      },
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
    }),
  )

  // El poll de la dashboard son cuatro requests cada seis segundos, y una de
  // ellas trae *todos* los mensajes del día abierto. Sin comprimir, cien
  // dashboards abiertas son del orden de un terabyte de salida por mes; el JSON
  // baja alrededor del 90% con gzip. Va antes de las rutas para alcanzarlas a
  // todas. Los adjuntos no pasan por acá: `compression` se saltea solo los
  // tipos que ya vienen comprimidos (imagen, audio, video).
  app.use(compression())

  // Capture the raw body alongside the parsed one: verifyMetaSignature needs
  // the exact bytes Meta signed, which the parsed req.body can't reproduce.
  app.use(
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf
      },
    }),
  )

  // El healthcheck del host: tiene que contestar sin sesión y sin tocar la
  // base, porque es lo que decide si el deploy nuevo reemplaza al viejo.
  app.get('/health', (req, res) => res.json({ ok: true }))

  // Los webhooks van antes de la resolución de tenant: los firma Meta, no
  // nosotros, y no pueden mandar una API key. Resuelven su propio cliente por
  // el phone_number_id del payload.
  app.use('/webhooks', webhooksRouter)

  // El cuestionario de la landing: la persona acaba de pagar (o de probar) y
  // todavía no tiene API key. Misma excepción que los webhooks.
  app.use('/altas', altasRouter)

  // De acá para abajo, todo exige API key y todo queda scopeado a req.tenant.
  app.use(resolveTenant)

  // Quién soy y a qué negocios entro. Es lo primero que pide la dashboard al
  // abrir: si esto responde, la sesión sirve.
  app.use('/me', meRouter)

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
