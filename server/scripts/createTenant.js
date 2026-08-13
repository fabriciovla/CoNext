// Alta de un cliente desde la línea de comandos:
//   node scripts/createTenant.js "Almacén Doña Rosa" "+5491155550000"
//
// Es lo que más adelante va a hacer Embedded Signup solo. Hasta entonces, es la
// única forma de crear un tenant — y como la API key se muestra una sola vez
// (en la base queda el hash), hay que copiarla en el momento.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { provisionTenant, setWhatsappCredentials } from '../src/services/tenantsService.js'
import { closePool } from '../src/db/index.js'

const args = process.argv.slice(2)
const conectarWaDePrueba = args.includes('--connect-dev-wa')
const [name, whatsappNumber] = args.filter((a) => !a.startsWith('--'))

if (!name) {
  console.error(
    'Uso: node scripts/createTenant.js "<nombre del negocio>" ["<número>"] [--connect-dev-wa]\n\n' +
      '  --connect-dev-wa  le conecta a este cliente el número de prueba de Meta que\n' +
      '                    está en DEV_WA_* del .env. Solo para desarrollo: en\n' +
      '                    producción cada cliente conecta el suyo por Embedded Signup.',
  )
  process.exit(1)
}

await migrate()

const tenant = await provisionTenant({
  name,
  storeName: name,
  whatsappNumber: whatsappNumber ?? '',
})

if (conectarWaDePrueba) {
  const accessToken = process.env.DEV_WA_ACCESS_TOKEN
  const phoneNumberId = process.env.DEV_WA_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) {
    console.warn('[aviso] --connect-dev-wa pedido pero faltan DEV_WA_ACCESS_TOKEN o DEV_WA_PHONE_NUMBER_ID')
  } else {
    await setWhatsappCredentials(tenant.id, { wabaId: null, phoneNumberId, accessToken })
    console.log(`[whatsapp] número de prueba ${phoneNumberId} conectado a este cliente (token cifrado)`)
  }
}

console.log(`
Cliente creado.

  id:    ${tenant.id}
  slug:  ${tenant.slug}
  name:  ${tenant.name}

  API key (se muestra una sola vez, guardala ahora):

    ${tenant.apiKey}

Para la dashboard local, poné esa clave como API_KEY en server/.env — es la que
inyecta el proxy de Vite en cada request.
`)

await closePool()
