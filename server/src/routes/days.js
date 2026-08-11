import { Router } from 'express'
import { openDay, closeDay, listClosedDays, getCurrentDayState } from '../services/dayService.js'

const router = Router()

router.get('/current', (req, res) => {
  res.json(getCurrentDayState())
})

router.get('/', (req, res) => {
  if (req.query.status === 'closed') return res.json(listClosedDays())
  res.json(listClosedDays())
})

router.post('/open', (req, res) => {
  res.json(openDay())
})

router.post('/close', (req, res) => {
  const closed = closeDay()
  if (!closed) return res.status(409).json({ error: 'No hay un día abierto' })
  res.json(closed)
})

export default router
