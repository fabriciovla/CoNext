// CLI helper: node scripts/simulate.js "+54 9 11 5555-0000" whatsapp "¿Tienen la remera en talle M?" "Test User"
//
// /dev/simulate-incoming ahora está detrás de la resolución de tenant, así que
// la request tiene que llevar la API key del cliente que se quiere simular.
import 'dotenv/config'

const [phone, channel = 'whatsapp', text, customerName] = process.argv.slice(2)

if (!phone || !text) {
  console.error('Uso: node scripts/simulate.js <phone> <channel> "<text>" ["customerName"]')
  process.exit(1)
}

const apiKey = process.env.API_KEY
if (!apiKey) {
  console.error('Falta API_KEY en server/.env: es la clave del cliente que se quiere simular.')
  process.exit(1)
}

const port = process.env.PORT || 3001
const res = await fetch(`http://localhost:${port}/dev/simulate-incoming`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  body: JSON.stringify({ phone, channel, text, customerName }),
})

console.log(res.status, await res.json())
