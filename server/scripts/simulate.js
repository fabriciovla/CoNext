// CLI helper: node scripts/simulate.js "+54 9 11 5555-0000" whatsapp "¿Tienen la remera en talle M?" "Test User"
const [phone, channel = 'whatsapp', text, customerName] = process.argv.slice(2)

if (!phone || !text) {
  console.error('Uso: node scripts/simulate.js <phone> <channel> "<text>" ["customerName"]')
  process.exit(1)
}

const port = process.env.PORT || 3001
const res = await fetch(`http://localhost:${port}/dev/simulate-incoming`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, channel, text, customerName }),
})

console.log(res.status, await res.json())
