import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { contestoAlta, guardarAlta } from '../services/altasService.js'

const router = Router()

// Público: lo llama la landing cuando termina el cuestionario de /empezar.
// No hay API key — la persona todavía no es un tenant. Va montado *antes*
// de resolveTenant en app.js.

router.post(
  '/',
  ah(async (req, res) => {
    const { plan, correo, respuestas } = req.body ?? {}
    const alta = await guardarAlta({ plan, correo, respuestas })
    res.status(201).json(alta)
  }),
)

// Lo pregunta el login —el del sitio y el de la dashboard— antes de dejar
// entrar: si esta cuenta todavía no contestó, va primero a /empezar.
//
// Contesta un booleano pelado y nunca el contenido del alta. Aun así dice si un
// correo pasó por el cuestionario, que es tanto como decir si compró: cuando
// haya sesión de verdad, esto se scopea a la propia. Hasta entonces es el mismo
// recinto abierto en el que ya vive el POST de al lado.
router.get(
  '/estado',
  ah(async (req, res) => {
    res.json({ contesto: await contestoAlta(req.query.correo) })
  }),
)

export default router
