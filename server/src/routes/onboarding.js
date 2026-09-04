import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import { one } from '../db/index.js'
import {
  getTenant,
  getWhatsappCredentials,
  setWhatsappCredentials,
  getMetaCredentials,
  setMetaCredentials,
  setCanalMeta,
  clearWhatsappCredentials,
  clearMetaCredentials,
} from '../services/tenantsService.js'
import multer from 'multer'
import { connectWhatsappAccount, getPhoneNumberInfo } from '../services/whatsappOnboarding.js'
import {
  RUBROS,
  getPerfil,
  validarPerfil,
  actualizarPerfil,
  subirFotoPerfil,
} from '../services/whatsappProfile.js'
import {
  PERMISOS,
  aTokenLargo,
  listarPaginas,
  connectMetaAccount,
  verificarTokenPagina,
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
      // Qué canales atiende el CRM. La conexión es una sola y no se puede
      // partir, así que esto es lo único que el negocio elige.
      canales: {
        instagram: tenant.instagram_activo === 1,
        messenger: tenant.messenger_activo === 1,
      },
    }

    const creds = await getMetaCredentials(req.tenantId)
    if (!creds) {
      return res.json({ ...base, vigente: false, error: 'No hay un token guardado para esta Página.' })
    }

    try {
      const { valido, motivo } = await verificarTokenPagina(creds.pageAccessToken)

      // `valido: null` es "no pudimos comprobarlo" y no "está vencido": pasa
      // cuando faltan las credenciales de la app. Decir que la conexión murió
      // por un problema nuestro de configuración manda a reconectar una Página
      // que está bien, que es el error que esta pantalla ya cometía.
      if (valido === null) return res.json({ ...base, vigente: true, verificado: false })

      if (!valido) {
        return res.json({
          ...base,
          vigente: false,
          // Mensaje para una persona, no el texto de Graph. El de Meta habla de
          // endpoints y permisos, que no le dice nada a quien atiende la tienda.
          error: 'Meta ya no acepta este acceso. Puede haberse revocado desde el Business Manager.',
          detalle: motivo ?? null,
        })
      }

      res.json({ ...base, vigente: true, verificado: true })
    } catch (err) {
      // Si `debug_token` no contesta, lo que falló fue nuestra consulta y no el
      // token del cliente. Se deja la conexión como buena y se marca sin
      // verificar: un corte de red no es motivo para mandar a reconectar.
      console.error('[onboarding/meta/status] no se pudo verificar el token', err)
      res.json({ ...base, vigente: true, verificado: false })
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

      // `listarPaginas` trae el token de cada Página, y eso **no sale de acá**:
      // es la credencial que manda mensajes en nombre del negocio. La pantalla
      // solo necesita saber cuál elegir, así que viaja el nombre y nada más.
      res.json({
        accessToken: tokenLargo,
        paginas: paginas.map(({ id, nombre, igAccountId, igUsername }) => ({
          id,
          nombre,
          igAccountId,
          igUsername,
        })),
      })
    } catch (err) {
      return res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }
  }),
)

// Prender o apagar un canal. No toca la conexión ni el token: solo decide si
// procesamos lo que llega por ahí.
router.patch(
  '/meta/canales/:canal',
  ah(async (req, res) => {
    const { activo } = req.body ?? {}
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'Falta "activo" (true o false)' })
    }

    // El nombre del canal viene de la URL y termina eligiendo una columna, así
    // que `setCanalMeta` solo acepta los dos conocidos y devuelve null con
    // cualquier otra cosa. Sin ese corte sería un nombre de columna elegido por
    // quien llama.
    const canales = await setCanalMeta(req.tenantId, req.params.canal, activo)
    if (!canales) return res.status(400).json({ error: `Canal desconocido: ${req.params.canal}` })

    res.json({ canales })
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


// ---------------------------------------------------------------------------
// Perfil del negocio en WhatsApp
//
// Es lo que el dueño editaba desde la app del celular y deja de poder tocar
// cuando el número pasa a la Cloud API. Vive en Meta, no en nuestra base: se
// lee en vivo en cada visita, igual que las plantillas.
// ---------------------------------------------------------------------------

// La foto pasa por memoria: no se guarda de nuestro lado, se reenvía a Meta y
// se descarta. El tope acá es el de Meta para la foto de perfil.
const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('file')

// Sin número conectado no hay perfil que leer, y es un estado normal —no un
// error—: la pantalla tiene que poder decir "conectá WhatsApp primero".
async function credencialesDeWhatsapp(req, res) {
  const creds = await getWhatsappCredentials(req.tenantId)
  if (!creds) {
    res.status(409).json({ error: 'No hay un WhatsApp conectado', codigo: 'sin-whatsapp' })
    return null
  }
  return creds
}

router.get(
  '/whatsapp/profile',
  ah(async (req, res) => {
    const creds = await credencialesDeWhatsapp(req, res)
    if (!creds) return

    try {
      res.json({ perfil: await getPerfil(creds.phoneNumberId, creds.accessToken), rubros: RUBROS })
    } catch (err) {
      // Un token vencido o un permiso que falta son errores del cliente, no
      // nuestros: se contestan para que la pantalla los muestre y ofrezca
      // reconectar, en vez de un 500 que se lee como una caída del CRM.
      res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }
  }),
)

router.put(
  '/whatsapp/profile',
  ah(async (req, res) => {
    // Lo que se puede validar sin salir del server va primero: son errores de
    // lo que la persona escribió y se contestan igual esté o no vigente el
    // token.
    const invalido = validarPerfil(req.body ?? {})
    if (invalido) return res.status(400).json({ error: invalido })

    const creds = await credencialesDeWhatsapp(req, res)
    if (!creds) return

    try {
      res.json({ perfil: await actualizarPerfil(creds.phoneNumberId, creds.accessToken, req.body ?? {}) })
    } catch (err) {
      res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }
  }),
)

router.post(
  '/whatsapp/profile/photo',
  (req, res, next) =>
    subirFoto(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'La foto supera los 5 MB' })
      }
      next(err)
    }),
  ah(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta la foto' })

    const creds = await credencialesDeWhatsapp(req, res)
    if (!creds) return

    try {
      res.json({ perfil: await subirFotoPerfil(creds.phoneNumberId, creds.accessToken, req.file) })
    } catch (err) {
      res.status(400).json({ error: err.message, metaCode: err.metaCode ?? null })
    }
  }),
)

// Soltar la conexión. No toca nada del lado de Meta —los permisos que dio el
// cliente siguen ahí— y no borra mensajes: desconectar no es borrar la bandeja.
//
// Hace falta para poder volver a filmar el alta, que es lo que pide el App
// Review, y porque un cliente tiene que poder desengancharse sin escribirnos.
router.post(
  '/disconnect',
  ah(async (req, res) => {
    await clearWhatsappCredentials(req.tenantId)
    res.json({ conectado: false })
  }),
)

router.post(
  '/meta/disconnect',
  ah(async (req, res) => {
    await clearMetaCredentials(req.tenantId)
    res.json({ conectado: false })
  }),
)

export default router
