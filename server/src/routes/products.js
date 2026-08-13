import { Router } from 'express'
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/productsService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getProducts(req.tenantId))
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const { name, price, stock } = req.body
    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: 'name, price y stock son obligatorios' })
    }
    res.status(201).json(await addProduct(req.tenantId, { name, price, stock }))
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
