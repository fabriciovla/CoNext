import { createReadStream } from 'node:fs'
import { Router } from 'express'
import multer from 'multer'
import { getOpenMessages, getMessagesForDay } from '../services/dayService.js'
import {
  sendOutboundMessage,
  sendOutboundMedia,
  getMessageMedia,
} from '../services/conversationService.js'
import { guardarAdjunto, rutaAbsoluta } from '../services/mediaService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// El archivo pasa por memoria y no por un temporal de multer: lo escribe
// `guardarAdjunto`, que además decide el nombre y, si es un audio del navegador,
// lo convierte antes de tocar el disco definitivo. El tope es el mayor de los
// de Meta (documento, 25 MB); los límites finos por tipo los aplica el servicio,
// que es el que puede decir cuál era el máximo del tipo que se mandó.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
})

// El error de multer por tamaño es un "File too large" en inglés que termina
// como 500 genérico en la dashboard. Acá se traduce y se contesta con el código
// que corresponde.
const subirArchivo = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'El archivo supera los 25 MB que acepta WhatsApp' })
    }
    next(err)
  })

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

// Adjuntos. Va como multipart y no como JSON con base64: un audio de un minuto
// en base64 son varios MB de string que hay que parsear entero en memoria antes
// de poder mirarlo.
router.post(
  '/media',
  subirArchivo,
  ah(async (req, res) => {
    const { phone, caption } = req.body
    if (!phone) return res.status(400).json({ error: 'phone es obligatorio' })
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' })

    const media = await guardarAdjunto(req.tenantId, {
      buffer: req.file.buffer,
      mime: req.file.mimetype,
      filename: req.file.originalname,
    })

    const message = await sendOutboundMedia(
      req.tenantId,
      phone,
      media,
      String(caption ?? '').trim(),
      'admin',
    )
    res.status(201).json(message)
  }),
)

// Sirve el adjunto de un mensaje. La dashboard lo pide con <img>/<audio>, así
// que la API key la pone el proxy de Vite igual que en cualquier otra request.
router.get(
  '/media/:id',
  ah(async (req, res) => {
    const media = await getMessageMedia(req.tenantId, req.params.id)
    if (!media) return res.status(404).json({ error: 'Ese mensaje no tiene adjunto' })

    res.type(media.mime || 'application/octet-stream')
    // Los documentos se bajan con su nombre original; lo que se puede ver en el
    // hilo (imagen, audio, video) se muestra inline.
    if (media.kind === 'document') {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(media.name)}"`)
    }

    const stream = createReadStream(rutaAbsoluta(media.path))
    // El archivo puede no estar (disco nuevo, copia sin uploads/). Sin este
    // handler, el error del stream tumba el proceso entero.
    stream.on('error', (err) => {
      console.error('[media] no se pudo leer el adjunto', media.path, err)
      if (!res.headersSent) res.status(404).json({ error: 'El archivo ya no está en el server' })
      else res.end()
    })
    stream.pipe(res)
  }),
)

export default router
