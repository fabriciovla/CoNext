import { Router } from 'express'
import { getSettings, updateSettings } from '../services/settingsService.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(getSettings())
})

router.put('/', (req, res) => {
  res.json(updateSettings(req.body))
})

export default router
