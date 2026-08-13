import { Router } from 'express'
import { getSettings, updateSettings } from '../services/settingsService.js'
import { ah } from '../middleware/asyncHandler.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    res.json(await getSettings(req.tenantId))
  }),
)

router.put(
  '/',
  ah(async (req, res) => {
    res.json(await updateSettings(req.tenantId, req.body))
  }),
)

export default router
