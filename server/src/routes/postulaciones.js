import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { guardarPostulacion } from '../services/postulacionesService.js'

const router = Router()

// Público: lo llama la landing desde la sección "Postulate en conext". No hay
// API key —quien postula todavía no es un tenant— y va montado *antes* de
// resolveTenant en app.js, igual que /altas.

router.post(
  '/',
  ah(async (req, res) => {
    const { nombre, contacto, negocio, idioma } = req.body ?? {}
    const postulacion = await guardarPostulacion({ nombre, contacto, negocio, idioma })
    res.status(201).json(postulacion)
  }),
)

export default router
