import { Router } from 'express'
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getFolders,
  addFolder,
  updateFolder,
  deleteFolder,
} from '../services/productsService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

// Las carpetas van declaradas antes que las rutas de /:id. No se pisan (una
// carpeta son dos segmentos: /folders/f-…), pero dejarlas arriba evita que
// mañana alguien agregue un GET /:id y "folders" pase a ser un id de producto.
router.get(
  '/folders',
  ah(async (req, res) => {
    res.json(await getFolders(req.tenantId))
  }),
)

// Un nombre repetido no es un error del sistema sino algo que el admin puede
// arreglar tipeando otra cosa, así que se contesta 409 con el motivo y la
// dashboard lo muestra debajo del campo.
const ERRORES = {
  'nombre-vacio': { status: 400, error: 'La carpeta necesita un nombre.' },
  duplicada: { status: 409, error: 'Ya tenés una carpeta con ese nombre.' },
  'not-found': { status: 404, error: 'Carpeta no encontrada' },
}

router.post(
  '/folders',
  ah(async (req, res) => {
    const { folder, error } = await addFolder(req.tenantId, { name: req.body.name })
    if (error) return res.status(ERRORES[error].status).json({ error: ERRORES[error].error })
    res.status(201).json(folder)
  }),
)

router.put(
  '/folders/:id',
  ah(async (req, res) => {
    const { folder, error } = await updateFolder(req.tenantId, req.params.id, { name: req.body.name })
    if (error) return res.status(ERRORES[error].status).json({ error: ERRORES[error].error })
    res.json(folder)
  }),
)

router.delete(
  '/folders/:id',
  ah(async (req, res) => {
    const { deleted } = await deleteFolder(req.tenantId, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Carpeta no encontrada' })
    res.status(204).end()
  }),
)

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getProducts(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { name, price, stock, folderId } = req.body
    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: 'name, price y stock son obligatorios' })
    }
    res.status(201).json(await addProduct(req.tenantId, { name, price, stock, folderId }))
  }),
)

router.put(
  '/:id',
  ah(async (req, res) => {
    const updated = await updateProduct(req.tenantId, req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(updated)
  }),
)

router.delete(
  '/:id',
  ah(async (req, res) => {
    await deleteProduct(req.tenantId, req.params.id)
    res.status(204).end()
  }),
)

export default router
