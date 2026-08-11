import crypto from 'node:crypto'

// Todo lo que no sea un webhook exige la API key. Hace falta porque el server
// se publica por un túnel para que Meta lo alcance, y ese túnel no expone solo
// el webhook: expone la API entera. Sin esto, cualquiera con la URL puede leer
// las conversaciones y mandar mensajes desde el número del negocio.
//
// Los webhooks quedan afuera a propósito: no pueden mandar un header nuestro,
// y ya se autentican con la firma del proveedor (verifyMetaSignature).
export function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY
  if (!expected) return next() // sin configurar: se avisa al arrancar, no se bloquea

  const provided = req.get('x-api-key') ?? ''

  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  next()
}
