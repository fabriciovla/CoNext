// Conecta la Página de Facebook (Messenger) y su cuenta de Instagram a un
// cliente ya creado:
//
//   node scripts/connectMeta.js <tenantId|slug> "EAAG…" [pageId]
//
// El token que se pega acá es uno de **usuario**, del Explorador de la API de
// Graph, con los permisos pages_show_list, pages_messaging, pages_manage_metadata,
// instagram_basic e instagram_manage_messages. El script hace el resto: lo
// cambia por uno largo, saca el token de la Página, la suscribe a los webhooks
// y guarda todo cifrado.
//
// Si no se pasa el pageId y la persona administra una sola Página, se toma esa.
// Con varias se listan y se corta: elegir por nosotros sería conectar la
// equivocada, y desconectarla después es más trabajo que volver a correr esto.
//
// En producción esto lo hace el botón de Configuración (Facebook Login). Este
// script es para desarrollo, que es donde todavía no está el App Review — y
// para eso alcanza con que la cuenta tenga un rol en la app.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, closePool } from '../src/db/index.js'
import { setMetaCredentials, getMetaCredentials } from '../src/services/tenantsService.js'
import { aTokenLargo, listarPaginas, connectMetaAccount } from '../src/services/metaOnboarding.js'

const [ref, tokenArg, pageArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))

if (!ref || !tokenArg) {
  console.error('Uso: node scripts/connectMeta.js <tenantId|slug> "<token de usuario>" [pageId]')
  process.exit(1)
}

// Todo va adentro de una función para poder salir con `return`: llamar a
// process.exit() con el pool todavía cerrándose aborta el proceso con un
// assert de libuv en Windows en vez de imprimir el error.
async function main() {
  await migrate()

  const tenant = await one('SELECT id, name, slug FROM tenants WHERE id = $1 OR slug = $1', [ref])
  if (!tenant) {
    console.error(`No existe ningún cliente con id o slug "${ref}"`)
    return 1
  }

  let tokenLargo
  let paginas
  try {
    tokenLargo = await aTokenLargo(tokenArg)
    paginas = await listarPaginas(tokenLargo)
  } catch (err) {
    console.error(`\nEl token no sirve: ${err.message}`)
    console.error('\nGenerá uno nuevo en developers.facebook.com/tools/explorer con los permisos de la cabecera.')
    return 1
  }

  if (paginas.length === 0) {
    console.error('\nEse token no administra ninguna Página. Revisá el permiso pages_show_list.')
    return 1
  }

  const pageId = pageArg ?? (paginas.length === 1 ? paginas[0].id : null)

  if (!pageId) {
    console.error('\nEse token administra varias Páginas. Elegí una y pasala como tercer argumento:\n')
    for (const p of paginas) {
      console.error(`  ${p.id}  ${p.nombre}${p.igUsername ? `  (ig: @${p.igUsername})` : '  (sin Instagram)'}`)
    }
    console.error('')
    return 1
  }

  let resultado
  try {
    // Se le pasa el token largo: `connectMetaAccount` lo vuelve a cambiar y
    // cambiar uno largo es idempotente, así que no hace falta un camino aparte.
    resultado = await connectMetaAccount({ accessToken: tokenLargo, pageId })
  } catch (err) {
    console.error(`\nNo se pudo conectar: ${err.message}`)
    return 1
  }

  await setMetaCredentials(tenant.id, resultado)
  const guardadas = await getMetaCredentials(tenant.id)

  console.log(`
Meta conectado para "${tenant.name}" (${tenant.slug}).

  página:       ${resultado.pageName ?? 'sin nombre'} (${resultado.pageId})
  instagram:    ${resultado.igUsername ? `@${resultado.igUsername} (${resultado.igAccountId})` : 'no asociada'}
  cifrado ok:   ${guardadas?.pageAccessToken === resultado.pageAccessToken ? 'sí' : 'NO — revisá ENCRYPTION_KEY'}
`)

  for (const aviso of resultado.avisos) console.warn(`[aviso] ${aviso}`)

  return 0
}

process.exitCode = await main()
await closePool()
