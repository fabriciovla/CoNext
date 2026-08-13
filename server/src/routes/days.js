import { Router } from 'express'
import { openDay, closeDay, listClosedDays, getCurrentDayState } from '../services/dayService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

router.get(
  '/current',
  ah(async (req, res) => {
    res.json(await getCurrentDayState(req.tenantId))
  }),
)

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await listClosedDays(req.tenantId))
  }),
)

router.post(
  '/open',
  ah(async (req, res) => {
    res.json(await openDay(req.tenantId))
  }),
)

router.post(
  '/close',
  ah(async (req, res) => {
    const closed = await closeDay(req.tenantId)
    if (!closed) return res.status(409).json({ error: 'No hay un día abierto' })
    res.json(closed)
  }),
)

export default router
