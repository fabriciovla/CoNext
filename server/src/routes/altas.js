import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { guardarAlta } from '../services/altasService.js'

const router = Router()

// Público: lo llama la landing cuando termina el cuestionario de /empezar.
// No hay API key — la persona todavía no es un tenant. Va montado *antes*
// de resolveTenant en app.js.

router.post(
  '/',
  ah(async (req, res) => {
    const { plan, respuestas } = req.body ?? {}
    const alta = await guardarAlta({ plan, respuestas })
    res.status(201).json(alta)
  }),
)

export default router
