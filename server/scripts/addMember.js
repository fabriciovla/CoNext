// Ata una persona a un cliente:
//   node scripts/addMember.js <slug|tenantId> <email> [owner|admin|operador]
//
// Es el puente que faltaba entre el alta por CLI y el login: `createTenant`
// deja el negocio sin miembros, así que entrar con Google devolvía "tu cuenta
// todavía no está asociada a ningún negocio" aunque la sesión fuera válida.
//
// El email es el de la cuenta con la que se va a entrar (el de Google o GitHub,
// tal cual). No hace falta que ya se haya registrado: si no existe, queda como
// invitación y el trigger de Supabase la convierte en membresía la primera vez
// que esa persona inicia sesión.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, closePool } from '../src/db/index.js'
import { addMember, updateMemberRole, parseRole } from '../src/services/membersService.js'

const [referencia, email, rolPedido = 'owner'] = process.argv.slice(2)

if (!referencia || !email) {
  console.error(
    'Uso: node scripts/addMember.js <slug|tenantId> <email> [owner|admin|operador]\n\n' +
      '  El rol por defecto es owner, que es el caso del dueño del negocio.',
  )
  process.exit(1)
}

const rol = parseRole(rolPedido, 'owner')
if (!rol) {
  console.error(`Rol inválido: "${rolPedido}". Los que hay son owner, admin y operador.`)
  process.exit(1)
}

await migrate()

const tenant = await one('SELECT id, name, slug FROM tenants WHERE slug = $1 OR id = $1', [referencia])
if (!tenant) {
  console.error(`No hay ningún cliente con slug o id "${referencia}".`)
  await closePool()
  process.exit(1)
}

const resultado = await addMember(tenant.id, { email, role: rol })

// Correr el script dos veces tiene que ser inofensivo, y con un rol distinto
// tiene que servir para cambiarlo: es la forma más corta de arreglar un alta
// hecha con el rol equivocado.
if (resultado.error === 'ya-es-miembro') {
  if (resultado.member.role !== rol) {
    await updateMemberRole(tenant.id, resultado.member.userId, rol)
    console.log(`${email} pasó de ${resultado.member.role} a ${rol} en "${tenant.name}".`)
  } else {
    console.log(`${email} ya era ${rol} de "${tenant.name}". No hubo nada que cambiar.`)
  }
  await closePool()
  process.exit(0)
}

if (resultado.error) {
  console.error(`No se pudo: ${resultado.error}`)
  await closePool()
  process.exit(1)
}

if (resultado.invite) {
  console.log(
    `Invitación anotada para ${email} como ${rol} en "${tenant.name}".\n` +
      'Todavía no tiene cuenta: la membresía se arma sola cuando entre por primera vez.',
  )
} else {
  console.log(`${email} ya es ${rol} de "${tenant.name}".`)
}

await closePool()
