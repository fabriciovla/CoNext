// Deja un cliente listo para que el revisor de Meta le escriba y le contesten.
//
//   npm run preparar-revision -- <tenantId|slug>
//
// El App Review se prueba solo: el revisor abre el m.me, manda un mensaje y
// espera una respuesta. Si en ese momento falta cualquiera de las cuatro cosas
// de abajo, no le contesta nadie y la solicitud vuelve rechazada sin decir por
// qué — que es el modo más caro de descubrir que el día estaba cerrado.
//
// Las cuatro:
//
//   1. Un día abierto. Sin día no se envía nada, ni siquiera el aviso de
//      ausencia.
//   2. Horario 24/7. El revisor prueba cuando quiere, y a las 3 de la mañana
//      hoy le llega el aviso de ausencia y nada más.
//   3. Al menos un agente encendido y con autoSend. El interruptor del agente
//      es un techo sobre lo que decida el modelo: apagado, la respuesta queda
//      como borrador y el revisor no ve nada.
//   4. El idioma de la IA en `en`. El revisor escribe en inglés y tiene que
//      recibir inglés. `auto` —contestar en el idioma del cliente— parecía lo
//      correcto y **no alcanza**: el prompt entero está escrito en español y
//      el modelo arrastra ese idioma igual, así que a un "Hi, what do you
//      sell?" le contesta en español. Verificado contra el modelo, no supuesto.
//      El costo es que mientras dure la revisión los clientes reales del
//      negocio también reciben inglés; por eso el script imprime cuál era el
//      idioma anterior, para poder volver.
//
// Es idempotente: se puede correr las veces que haga falta.
import 'dotenv/config'
import { migrate } from '../src/db/migrate.js'
import { one, closePool } from '../src/db/index.js'
import { getSettings, updateSettings, WEEK_DAYS } from '../src/services/settingsService.js'
import { getOpenDay, openDay } from '../src/services/dayService.js'
import { getAgents, updateAgent } from '../src/services/agentsService.js'

const HORARIO_24_7 = Object.fromEntries(
  WEEK_DAYS.map((dia) => [dia, { openTime: '00:00', closeTime: '23:59' }]),
)

async function main() {
  const ref = process.argv[2]
  if (!ref) {
    console.error('Uso: npm run preparar-revision -- <tenantId|slug>')
    process.exit(1)
  }

  await migrate()
  const tenant = await one('SELECT id, name, slug FROM tenants WHERE id = $1 OR slug = $1', [ref])
  if (!tenant) {
    console.error(`No existe ningún cliente con id o slug "${ref}".`)
    await closePool()
    process.exit(1)
  }
  console.log(`Cliente: ${tenant.name} (${tenant.slug})\n`)

  // 1. Día abierto.
  let dia = await getOpenDay(tenant.id)
  if (dia) {
    console.log(`  ok   ya hay un día abierto (${dia.id})`)
  } else {
    dia = await openDay(tenant.id)
    console.log(`  +    día abierto (${dia.id})`)
  }

  // 2 y 4. Horario y idioma. Van juntos porque `updateSettings` escribe la fila
  // entera: mandarlos por separado sería pisar uno con el otro.
  const antes = await getSettings(tenant.id)
  await updateSettings(tenant.id, {
    ...antes,
    weeklyHours: HORARIO_24_7,
    aiLanguage: 'en',
  })
  console.log('  +    horario 00:00–23:59 los siete días')
  console.log(`  +    idioma de la IA: en (estaba en "${antes.aiLanguage}") — para volver, Configuración → Respuestas automáticas`)

  // 3. Un agente que conteste solo. Se toca el primero de la lista, que es el
  // de respaldo — el que atiende cuando ninguno encaja claro.
  const agentes = await getAgents(tenant.id)
  if (agentes.length === 0) {
    console.log('  !!   este cliente no tiene agentes: creá uno antes de mandar la revisión')
  } else {
    const encendidos = agentes.filter((a) => a.enabled)
    const objetivo = encendidos[0] ?? agentes[0]
    await updateAgent(tenant.id, objetivo.id, { enabled: true, autoSend: true })
    console.log(`  +    agente "${objetivo.name}" encendido y con envío automático`)

    const mudos = encendidos.filter((a) => a.id !== objetivo.id && !a.autoSend)
    if (mudos.length > 0) {
      console.log(
        `  !!   ${mudos.length} agente(s) encendido(s) sin autoSend: ` +
          `${mudos.map((a) => a.name).join(', ')}. Si el modelo elige uno de esos, ` +
          'la respuesta queda como borrador y el revisor no ve nada.',
      )
    }
  }

  const despues = await getSettings(tenant.id)
  console.log(`\nZona horaria: ${despues.timezone}`)
  console.log('Listo. Probá vos mismo con el m.me antes de mandar la revisión.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
