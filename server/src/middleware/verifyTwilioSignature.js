import crypto from 'node:crypto'

// Twilio's request-validation algorithm: HMAC-SHA1(authToken, url + sorted
// "key+value" concatenation of every POST param), base64-encoded, compared
// against X-Twilio-Signature. https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function verifyTwilioSignature(req, res, next) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return next() // not configured yet — don't block local testing

  const signature = req.get('X-Twilio-Signature')
  if (!signature) return res.status(401).json({ error: 'Falta la firma de Twilio' })

  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const url = `${protocol}://${req.get('host')}${req.originalUrl}`

  const sortedParams = Object.keys(req.body)
    .sort()
    .map((key) => `${key}${req.body[key]}`)
    .join('')

  const expected = crypto.createHmac('sha1', authToken).update(url + sortedParams).digest('base64')

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Firma de Twilio inválida' })
  }

  next()
}
