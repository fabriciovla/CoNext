import crypto from 'node:crypto'

// Dodo firma con Standard Webhooks (standardwebhooks.com), que no es el mismo
// esquema que Meta: tres headers en vez de uno, la firma en base64 y no en hex,
// y lo firmado incluye el id y la marca de tiempo, no solo el cuerpo. Eso
// último es lo que impide reenviar un evento capturado más tarde — la firma
// sirve para ese timestamp y nada más.
//
// La ventana de tolerancia es la que recomienda el estándar. Fuera de ella el
// evento se rechaza aunque la firma cierre: sin esto, un POST guardado hoy
// vuelve a valer el mes que viene.
const TOLERANCIA_MS = 5 * 60 * 1000

export function verifyDodoSignature(req, res, next) {
  const secreto = process.env.DODO_WEBHOOK_SECRET

  // A diferencia del de Meta, este no se saltea cuando falta el secreto. Aquel
  // trae mensajes y saltearlo desbloquea las pruebas locales; este trae pagos,
  // y una ruta que le cree a cualquiera que postee "este pagó" es una cuenta
  // gratis para el primero que encuentre la URL.
  if (!secreto) {
    console.error('[webhooks/dodo] falta DODO_WEBHOOK_SECRET: el evento se rechaza sin mirarlo')
    return res.status(503).json({ error: 'Webhook sin configurar' })
  }

  const id = req.get('webhook-id')
  const timestamp = req.get('webhook-timestamp')
  const firma = req.get('webhook-signature')
  if (!id || !timestamp || !firma || !req.rawBody) {
    return res.status(401).json({ error: 'Falta la firma del webhook' })
  }

  const enviado = Number(timestamp) * 1000
  if (!Number.isFinite(enviado) || Math.abs(Date.now() - enviado) > TOLERANCIA_MS) {
    return res.status(401).json({ error: 'Marca de tiempo fuera de la ventana' })
  }

  // El secreto del dashboard viene como `whsec_<base64>`, y lo que firma es el
  // base64 ya decodificado, no el string tal cual. Con el prefijo puesto la
  // firma nunca cierra y el error no dice por qué.
  const crudo = secreto.startsWith('whsec_') ? secreto.slice('whsec_'.length) : secreto
  const clave = Buffer.from(crudo, 'base64')

  // Se firma sobre los bytes exactos que llegaron (req.rawBody, que captura el
  // `verify` de express.json en app.js). Volver a serializar req.body puede dar
  // otra secuencia de bytes y entonces no cierra nunca.
  const esperada = crypto
    .createHmac('sha256', clave)
    .update(`${id}.${timestamp}.`)
    .update(req.rawBody)
    .digest('base64')

  // El header es una lista separada por espacios (`v1,<firma> v1,<otra>`):
  // mientras se rota el secreto vienen las dos y alcanza con que una cierre.
  const esperadaBuf = Buffer.from(esperada)
  const valida = firma.split(' ').some((parte) => {
    const valor = parte.split(',')[1]
    if (!valor) return false
    const buf = Buffer.from(valor)
    return buf.length === esperadaBuf.length && crypto.timingSafeEqual(buf, esperadaBuf)
  })

  if (!valida) return res.status(401).json({ error: 'Firma inválida' })

  next()
}
