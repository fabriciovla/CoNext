// Recarga el token de WhatsApp de un cliente ya creado:
//
//   node scripts/connectWa.js <tenantId|slug> "EAAT…" [phoneNumberId]
//   node scripts/connectWa.js mi-negocio --from-env   (usa DEV_WA_* del .env)
//
// El token temporal de la consola de Meta vence a las 24h, así que en desarrollo
// hay que renovarlo casi todos los días. `createTenant.js --connect-dev-wa` solo
// sirve para el alta: para un cliente que ya existe, esto evita tener que crear
// uno nuevo (y perder sus conversaciones) solo por un token vencido.
//
// En producción esto lo hace Embedded Signup, que devuelve un token de larga
// duración con alcance del cliente.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, closePool } from '../src/db/index.js'
import { setWhatsappCredentials, getWhatsappCredentials } from '../src/services/tenantsService.js'

const args = process.argv.slice(2)
const desdeEnv = args.includes('--from-env')
const [ref, tokenArg, phoneArg] = args.filter((a) => !a.startsWith('--'))

if (!ref || (!tokenArg && !desdeEnv)) {
  console.error(
    'Uso: node scripts/connectWa.js <tenantId|slug> "<access token>" [phoneNumberId]\n' +
      '     node scripts/connectWa.js <tenantId|slug> --from-env',
  )
  process.exit(1)
}

const accessToken = desdeEnv ? process.env.DEV_WA_ACCESS_TOKEN : tokenArg
const phoneNumberId = phoneArg ?? process.env.DEV_WA_PHONE_NUMBER_ID

if (!accessToken) {
  console.error('Falta el token: pasalo como argumento o cargá DEV_WA_ACCESS_TOKEN en el .env')
  process.exit(1)
}

// Todo va adentro de una función para poder salir con `return`: llamar a
// process.exit() con el pool todavía cerrándose aborta el proceso con un
// assert de libuv en Windows en vez de imprimir el error.
async function main() {
  await migrate()

  const tenant = await one('SELECT id, name, slug, phone_number_id FROM tenants WHERE id = $1 OR slug = $1', [ref])
  if (!tenant) {
    console.error(`No existe ningún cliente con id o slug "${ref}"`)
    return 1
  }

  const numeroFinal = phoneNumberId ?? tenant.phone_number_id
  if (!numeroFinal) {
    console.error('Falta el phone_number_id: pasalo como tercer argumento o cargá DEV_WA_PHONE_NUMBER_ID en el .env')
    return 1
  }

  // Se valida contra Graph antes de guardar: un token vencido guardado en la
  // base falla recién cuando entra un mensaje real, y ahí el error aparece como
  // un borrador que "no se envió" sin decir por qué.
  const version = process.env.WA_GRAPH_VERSION || 'v25.0'
  const res = await fetch(
    `https://graph.facebook.com/${version}/${numeroFinal}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  const data = await res.json()

  if (!res.ok) {
    console.error(`\nEl token no sirve (${res.status}): ${data?.error?.message ?? JSON.stringify(data)}`)
    console.error('\nGenerá uno nuevo en developers.facebook.com > tu app > WhatsApp > Configuración de la API.')
    return 1
  }

  await setWhatsappCredentials(tenant.id, { wabaId: null, phoneNumberId: numeroFinal, accessToken })
  const guardadas = await getWhatsappCredentials(tenant.id)

  console.log(`
Token actualizado para "${tenant.name}" (${tenant.slug}).

  número:          ${data.display_phone_number ?? numeroFinal} (${data.verified_name ?? 'sin nombre'})
  phone_number_id: ${numeroFinal}
  cifrado ok:      ${guardadas?.accessToken === accessToken ? 'sí' : 'NO — revisá ENCRYPTION_KEY'}
`)
  return 0
}

process.exitCode = await main()
await closePool()
