import { Router } from 'express'
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/productsService.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(getProducts())
})

router.post('/', (req, res) => {
  const { name, price, stock } = req.body
  if (!name || price == null || stock == null) {
    return res.status(400).json({ error: 'name, price y stock son obligatorios' })
  }
  res.status(201).json(addProduct({ name, price, stock }))
})

router.put('/:id', (req, res) => {
  const updated = updateProduct(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  deleteProduct(req.params.id)
  res.status(204).end()
})

export default router
