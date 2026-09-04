import { Router } from 'express'
import multer from 'multer'
import {
  getAgents,
  getAgent,
  addAgent,
  updateAgent,
  deleteAgent,
  reorderAgents,
  getAgentStats,
} from '../services/agentsService.js'
import {
  getSources,
  getSource,
  getSourcesForAgent,
  addSource,
  renameSource,
  deleteSource,
  setAgentSource,
  getUsoPorFuente,
} from '../services/knowledgeService.js'
import {
  ErrorDeFuente,
  MAX_ARCHIVO,
  extraerDeArchivo,
  extraerDeEnlace,
  extraerDeTexto,
} from '../services/knowledge/extraer.js'
import { probarAgente } from '../services/ai/probarAgente.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// El documento pasa por memoria y no por un temporal: de un PDF de 10 MB lo
// único que se guarda son los caracteres que salieron, así que el binario no
// llega a tocar el disco en ningún momento.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ARCHIVO, files: 1 },
})

const subirArchivo = (req, res, next) =>
  upload.single('file')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `El archivo supera los ${MAX_ARCHIVO / 1024 / 1024} MB` })
    }
    next(err)
  })

// Lo que la persona subió mal se contesta con lo que pasó y qué hacer, no con
// un 500: `ErrorDeFuente` es justamente el error que la pantalla puede mostrar
// tal cual (ver `knowledge/extraer.js`).
function alFallar(res, err) {
  if (err instanceof ErrorDeFuente) return res.status(400).json({ error: err.message })
  throw err
}

// ---------------------------------------------------------------- lo de siempre

// Antes de las rutas con `:id` para que no se las coma el parámetro.
router.get(
  '/stats',
  ah(async (req, res) => {
    res.json(await getAgentStats(req.tenantId))
  }),
)

// ------------------------------------------------------- material de entrenamiento

// Todas las fuentes del negocio, con cuántos agentes usa cada una. Va antes de
// `/:id` por lo mismo de arriba.
router.get(
  '/knowledge',
  ah(async (req, res) => {
    const [fuentes, uso] = await Promise.all([getSources(req.tenantId), getUsoPorFuente(req.tenantId)])
    res.json(fuentes.map((f) => ({ ...f, agentes: uso[f.id] ?? 0 })))
  }),
)

// Alta de una fuente. Las tres formas entran por acá porque de las tres sale lo
// mismo —un título y un bloque de texto—, y lo que cambia es de dónde se saca:
// un archivo va como multipart, un enlace y un texto como JSON.
router.post(
  '/knowledge',
  subirArchivo,
  ah(async (req, res) => {
    const { agentId = null, kind, url, title, content } = req.body ?? {}

    let extraida
    try {
      if (req.file) {
        extraida = extraerDeArchivo({
          buffer: req.file.buffer,
          mime: req.file.mimetype,
          filename: req.file.originalname,
        })
        extraida.kind = 'archivo'
      } else if (kind === 'enlace' || url) {
        if (!url?.trim()) return res.status(400).json({ error: 'Falta la dirección del enlace' })
        extraida = await extraerDeEnlace(url)
        extraida.kind = 'enlace'
      } else {
        extraida = extraerDeTexto({ titulo: title, contenido: content })
        extraida.kind = 'texto'
      }
    } catch (err) {
      return alFallar(res, err)
    }

    // El título que se escribió en la pantalla manda sobre el que salió del
    // archivo o del <title> de la página: es el que después se busca en la lista.
    const titulo = String(title ?? '').trim() || extraida.titulo

    const fuente = await addSource(req.tenantId, {
      kind: extraida.kind,
      title: titulo,
      origin: extraida.origen,
      content: extraida.contenido,
      // Se sube desde la pantalla de un agente, así que queda encendida para
      // ese agente. Un id que no existe no puede encender nada, y tampoco puede
      // tirar el alta: la fuente ya es del negocio.
      agentId: agentId && (await getAgent(req.tenantId, agentId)) ? agentId : null,
    })

    res.status(201).json(fuente)
  }),
)

router.put(
  '/knowledge/:sourceId',
  ah(async (req, res) => {
    const fuente = await renameSource(req.tenantId, req.params.sourceId, req.body?.title)
    if (!fuente) return res.status(400).json({ error: 'El nombre no puede quedar vacío' })
    res.json(fuente)
  }),
)

// Borra la fuente para todo el negocio, no solo para el agente desde el que se
// la está mirando. Apagarla para uno es el interruptor de más abajo.
router.delete(
  '/knowledge/:sourceId',
  ah(async (req, res) => {
    const borrada = await deleteSource(req.tenantId, req.params.sourceId)
    if (!borrada) return res.status(404).json({ error: 'Fuente no encontrada' })
    res.status(204).end()
  }),
)

router.get(
  '/:id/knowledge',
  ah(async (req, res) => {
    if (!(await getAgent(req.tenantId, req.params.id))) {
      return res.status(404).json({ error: 'Agente no encontrado' })
    }
    res.json(await getSourcesForAgent(req.tenantId, req.params.id))
  }),
)

// El interruptor de una fuente para un agente.
router.put(
  '/:id/knowledge/:sourceId',
  ah(async (req, res) => {
    const [agente, fuente] = await Promise.all([
      getAgent(req.tenantId, req.params.id),
      getSource(req.tenantId, req.params.sourceId),
    ])
    if (!agente || !fuente) return res.status(404).json({ error: 'Agente o fuente no encontrados' })

    await setAgentSource(req.tenantId, req.params.id, req.params.sourceId, req.body?.enabled !== false)
    res.json({ ...fuente, enabled: req.body?.enabled !== false })
  }),
)

// ------------------------------------------------------------------- probar

// Una vuelta del pipeline contra este agente, sin escribir nada. Ver
// `services/ai/probarAgente.js`.
router.post(
  '/:id/test',
  ah(async (req, res) => {
    const resultado = await probarAgente(req.tenantId, req.params.id, req.body?.messages)
    if (resultado.error === 'not-found') return res.status(404).json({ error: 'Agente no encontrado' })
    if (resultado.error === 'sin-mensaje') {
      return res.status(400).json({ error: 'Hace falta un mensaje del cliente para probar' })
    }
    res.json(resultado)
  }),
)

// ---------------------------------------------------------------- agentes

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getAgents(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name es obligatorio' })
    res.status(201).json(await addAgent(req.tenantId, { ...req.body, name: name.trim() }))
  }),
)

router.post(
  '/reorder',
  ah(async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids debe ser un array' })
    res.json(await reorderAgents(req.tenantId, ids))
  }),
)

router.put(
  '/:id',
  ah(async (req, res) => {
    if ('name' in req.body && !req.body.name?.trim()) {
      return res.status(400).json({ error: 'name no puede quedar vacío' })
    }
    const updated = await updateAgent(req.tenantId, req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Agente no encontrado' })
    res.json(updated)
  }),
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    const { deleted, reason } = await deleteAgent(req.tenantId, req.params.id)
    if (deleted) return res.status(204).end()
    if (reason === 'not-found') return res.status(404).json({ error: 'Agente no encontrado' })
    return res.status(409).json({ error: 'Tiene que quedar al menos un agente' })
  }),
)

export default router
