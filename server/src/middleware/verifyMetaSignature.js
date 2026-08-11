import crypto from 'node:crypto'

// Meta signs the raw webhook body with the app secret; we compare against
// that raw buffer (captured by express.json's `verify` hook in app.js)
// rather than re-serializing req.body, which could produce a different
// byte sequence and always fail the check.
export function verifyMetaSignature(req, res, next) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    // No secret configured yet (e.g. still in dev before Meta approval) —
    // don't block local testing on it.
    return next()
  }

  const signature = req.get('X-Hub-Signature-256')
  if (!signature || !req.rawBody) {
    return res.status(401).json({ error: 'Falta la firma del webhook' })
  }

  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex')}`

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Firma inválida' })
  }

  next()
}
