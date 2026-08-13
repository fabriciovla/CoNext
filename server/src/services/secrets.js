import crypto from 'node:crypto'

// Cifrado de los tokens de acceso de WhatsApp de cada cliente. No es paranoia:
// un token de estos deja mandar mensajes en nombre del negocio de otro, así que
// un volcado de la base no puede alcanzar para usarlos. Cifrarlo después, con
// clientes ya conectados, obliga a re-cifrar en caliente — por eso va ahora.
//
// AES-256-GCM: además de cifrar, autentica. Un token manipulado en la base
// falla al descifrar en vez de devolver basura que después explota contra Meta.

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12 // el tamaño que recomienda GCM
const FORMATO = 'v1'

function getKey() {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'Falta ENCRYPTION_KEY en el .env: es la clave con la que se cifran los tokens\n' +
        'de WhatsApp de cada cliente. Generá una con:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    )
  }

  const key = Buffer.from(raw, 'hex')
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY tiene que ser 32 bytes en hex (64 caracteres); vinieron ${key.length}`)
  }
  return key
}

// Devuelve "v1:<iv hex>:<tag hex>:<cifrado hex>". El prefijo de versión es para
// poder rotar de algoritmo más adelante sin tener que adivinar qué es cada fila.
export function encrypt(plaintext) {
  if (plaintext == null || plaintext === '') return null

  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const cifrado = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${FORMATO}:${iv.toString('hex')}:${tag.toString('hex')}:${cifrado.toString('hex')}`
}

export function decrypt(stored) {
  if (stored == null || stored === '') return null

  const [version, ivHex, tagHex, dataHex] = String(stored).split(':')
  if (version !== FORMATO || !ivHex || !tagHex || !dataHex) {
    throw new Error('El valor cifrado no tiene el formato esperado (v1:iv:tag:datos)')
  }

  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8')
}

// Las API keys se guardan hasheadas. Determinístico a propósito: hay que poder
// buscar el tenant *por* la clave que llega en el header. Es seguro porque la
// clave la generamos nosotros con 32 bytes aleatorios — no hay diccionario que
// atacar como pasaría con una contraseña elegida por una persona.
export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(String(apiKey)).digest('hex')
}

export function generateApiKey() {
  return crypto.randomBytes(32).toString('hex')
}
