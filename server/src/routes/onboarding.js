import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { one } from '../db/index.js'
import {
  getTenant,
  getWhatsappCredentials,
  setWhatsappCredentials,
  getMetaCredentials,
  setMetaCredentials,
} from '../services/tenantsService.js'
import { connectWhatsappAccount, getPhoneNumberInfo } from '../services/whatsappOnboarding.js'
import {
  PERMISOS,
  aTokenLargo,
  listarPaginas,
  connectMetaAccount,
  getInfoPagina,
} from '../services/metaOnboarding.js'

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
      // Instagram y Messenger no usan config_id (no son Embedded Signup):
      // les alcanza con el app id y el secret, asi que pueden estar
      // disponibles aunque falte el de WhatsApp.
      metaConfigurado: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      permisosMeta: PERMISOS,
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

// ---------------------------------------------------------------------------
// Instagram y Messenger
//
// Mismo formato que las de arriba, pero en dos pasos en vez de uno: primero se
// listan las Páginas que administra la persona y después se conecta la que
// eligió. Con WhatsApp la elección pasa adentro del popup de Meta; acá no hay
// popup que la haga, así que la hace nuestra pantalla.
// ---------------------------------------------------------------------------

// Estado de la conexión de Messenger/Instagram. Va contra Graph por el mismo
// motivo que el de WhatsApp: el token puede estar revocado desde el Business
// Manager del cliente y en la base seguiría figurando conectado.
router.get(
  '/meta/status',
  ah(async (req, res) => {
    const tenant = await getTenant(req.tenantId)

    if (!tenant?.page_id) {
      return res.json({ conectado: false })
    }

    const base = {
      conectado: true,
      pageId: tenant.page_id,
      pageName: tenant.page_name,
      igAccountId: tenant.ig_account_id,
      igUsername: tenant.ig_username,
      connectedAt: tenant.meta_connected_at,
    }

    const creds = await getMetaCredentials(req.tenantId)
    if (!creds) return res.json({ ...base, vigente: false, error: 'No hay token guardado' })

    try {
      const info = await getInfoPagina(creds.pageId, creds.pageAccessToken)
      res.json({
        ...base,
        vigente: true,
        pageName: info?.name ?? base.pageName,
        // La cuenta de Instagram se puede atar o desatar desde Facebook sin
        // avisarnos, así que la de Graph manda sobre la que tenemos guardada.
        igUsername: info?.instagram_business_account?.username ?? base.igUsername,
        igAccountId: info?.instagram_business_account?.id ?? base.igAccountId,
      })
    } catch (err) {
      res.json({ ...base, vigente: false, error: err.message })
    }
  }),
)

// Las Páginas que administra quien acaba de dar el permiso.
//
// Recibe el token corto del navegador y lo primero que hace es cambiarlo por
// uno largo: si la persona se toma un rato en elegir, el corto se vence en el
// medio y la conexión fallaría recién en el paso siguiente. El largo vuelve al
// frontend para el segundo llamado — es el token de esa persona, que ya lo
// tenía en la mano, y no da acceso a nada nuestro.
router.post(
  '/meta/pages',
  ah(async (req, res) => {
    const { accessToken } = req.body ?? {}
    if (!accessToken) return res.status(400).json({ error: 'Falta el token de acceso' })

    try {
      const tokenLargo = await aTokenLargo(accessToken)
      const paginas = await listarPaginas(tokenLargo)
      res.json({ accessToken: tokenLargo, paginas })
    } catch (err) {
      return res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }
  }),
)

router.post(
  '/meta/connect',
  ah(async (req, res) => {
    const { accessToken, pageId } = req.body ?? {}

    // Mismo chequeo que el del número de WhatsApp, y por el mismo motivo: las
    // dos columnas son UNIQUE, así que conectar la Página de otro cliente
    // saldría como un error de Postgres en vez de una explicación.
    if (pageId) {
      const duenio = await one('SELECT id, name FROM tenants WHERE page_id = $1', [pageId])
      if (duenio && duenio.id !== req.tenantId) {
        return res.status(409).json({
          error: `Esa Página ya está conectada a otro cliente ("${duenio.name}"). Desconectala de allá primero.`,
        })
      }
    }

    let resultado
    try {
      resultado = await connectMetaAccount({ accessToken, pageId })
    } catch (err) {
      return res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }

    // La cuenta de Instagram también es única por cliente. Se chequea después
    // de hablar con Meta porque recién ahí sabemos cuál es: no la elige la
    // persona, viene atada a la Página.
    if (resultado.igAccountId) {
      const duenio = await one('SELECT id, name FROM tenants WHERE ig_account_id = $1', [resultado.igAccountId])
      if (duenio && duenio.id !== req.tenantId) {
        return res.status(409).json({
          error: `La cuenta de Instagram de esa Página ya está conectada a otro cliente ("${duenio.name}").`,
        })
      }
    }

    await setMetaCredentials(req.tenantId, resultado)

    res.json({
      conectado: true,
      pageId: resultado.pageId,
      pageName: resultado.pageName,
      igAccountId: resultado.igAccountId,
      igUsername: resultado.igUsername,
      avisos: resultado.avisos,
    })
  }),
)


export default router
