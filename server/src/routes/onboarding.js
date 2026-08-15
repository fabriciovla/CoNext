import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { one } from '../db/index.js'
import { getTenant, getWhatsappCredentials, setWhatsappCredentials } from '../services/tenantsService.js'
import { connectWhatsappAccount, getPhoneNumberInfo } from '../services/whatsappOnboarding.js'

const router = Router()

// Los identificadores públicos de la app salen del server y no del bundle: no
// son secretos (el popup de Meta los muestra igual), pero tenerlos en un solo
// lugar evita que el .env y el frontend se desincronicen y que el botón falle
// con un error de Meta que no dice nada.
router.get(
  '/config',
  ah(async (req, res) => {
    res.json({
      appId: process.env.META_APP_ID ?? null,
      configId: process.env.META_CONFIG_ID ?? null,
      graphVersion: process.env.WA_GRAPH_VERSION || 'v25.0',
      // Con esto la UI puede explicar qué falta en vez de mostrar un botón que
      // no anda.
      configurado: Boolean(process.env.META_APP_ID && process.env.META_CONFIG_ID && process.env.META_APP_SECRET),
    })
  }),
)

// Estado de la conexión del cliente logueado. Va contra Graph a propósito: en
// la base puede haber un token que ya fue revocado desde el Business Manager
// del cliente, y ahí la pantalla diría "conectado" mientras no entra ni un
// mensaje.
router.get(
  '/status',
  ah(async (req, res) => {
    const tenant = await getTenant(req.tenantId)

    if (!tenant?.phone_number_id) {
      return res.json({ conectado: false })
    }

    const base = {
      conectado: true,
      wabaId: tenant.waba_id,
      phoneNumberId: tenant.phone_number_id,
      connectedAt: tenant.connected_at,
    }

    const creds = await getWhatsappCredentials(req.tenantId)
    if (!creds) return res.json({ ...base, vigente: false, error: 'No hay token guardado' })

    try {
      const info = await getPhoneNumberInfo(creds.phoneNumberId, creds.accessToken)
      res.json({
        ...base,
        vigente: true,
        numero: info?.display_phone_number ?? null,
        nombre: info?.verified_name ?? null,
        calidad: info?.quality_rating ?? null,
      })
    } catch (err) {
      res.json({ ...base, vigente: false, error: err.message })
    }
  }),
)

// Lo que llama el frontend apenas cierra el popup de Embedded Signup. El código
// dura 30 segundos, así que acá no hay confirmaciones ni pasos intermedios: se
// canjea de una.
router.post(
  '/connect',
  ah(async (req, res) => {
    const { code, wabaId, phoneNumberId } = req.body ?? {}

    // Un número solo puede pertenecer a un cliente: la columna es UNIQUE, así
    // que sin este chequeo el conflicto saldría como un error de Postgres a los
    // gritos en vez de una explicación. Pasa de verdad cuando alguien conecta
    // por error el número de otro negocio que ya está en el sistema.
    if (phoneNumberId) {
      const duenio = await one('SELECT id, name FROM tenants WHERE phone_number_id = $1', [phoneNumberId])
      if (duenio && duenio.id !== req.tenantId) {
        return res.status(409).json({
          error: `Ese número ya está conectado a otro cliente ("${duenio.name}"). Desconectalo de allá primero.`,
        })
      }
    }

    let resultado
    try {
      resultado = await connectWhatsappAccount({ code, wabaId, phoneNumberId })
    } catch (err) {
      // Errores de Meta o del alta: son esperables (código vencido, permisos
      // que el cliente no dio, número de otra cuenta) y el cliente tiene que
      // poder leerlos y reintentar, no ver un 500.
      return res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }

    await setWhatsappCredentials(req.tenantId, {
      wabaId: resultado.wabaId,
      phoneNumberId: resultado.phoneNumberId,
      accessToken: resultado.accessToken,
    })

    res.json({
      conectado: true,
      wabaId: resultado.wabaId,
      phoneNumberId: resultado.phoneNumberId,
      numero: resultado.info?.display_phone_number ?? null,
      nombre: resultado.info?.verified_name ?? null,
      avisos: resultado.avisos,
    })
  }),
)

export default router
