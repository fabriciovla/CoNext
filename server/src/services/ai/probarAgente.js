import { getSettings } from '../settingsService.js'
import { getProducts } from '../productsService.js'
import { getAgent } from '../agentsService.js'
import { getContenidoPorAgente } from '../knowledgeService.js'
import { classifyAndDraft } from './classifyAndDraft.js'

// Probar un agente sin tocar nada.
//
// Es la misma llamada que hace el pipeline con un mensaje de verdad —el mismo
// prompt, el mismo catálogo, los mismos horarios y el mismo material de
// entrenamiento—, con dos diferencias que son el punto de esto:
//
//   - El equipo es de uno. En producción el modelo elige agente entre todos los
//     encendidos; acá se prueba ESTE, así que la lista tiene un solo nombre y la
//     respuesta sale sí o sí con su voz. Probar contra el equipo entero
//     contestaría con el agente que el modelo prefiera, que es justo lo que no
//     se está preguntando.
//   - No se escribe nada: ni conversación, ni mensaje, ni día. Nada de lo que
//     pasa acá sale para ningún lado ni aparece en la bandeja.
//
// Se prueba también un agente apagado: es el orden natural —se arma, se prueba,
// se prende—, y pedir que esté encendido para poder probarlo obligaría a
// prenderlo antes de saber qué contesta.

// El hilo de prueba que se manda al modelo. No es un límite de la pantalla sino
// del prompt: cada vuelta manda la conversación entera, así que sin tope una
// prueba larga termina costando más que una conversación real.
const MAX_HISTORIAL = 20
const MAX_TEXTO = 2000

export async function probarAgente(tenantId, agentId, mensajes) {
  const agent = await getAgent(tenantId, agentId)
  if (!agent) return { error: 'not-found' }

  const limpios = (Array.isArray(mensajes) ? mensajes : [])
    .filter((m) => typeof m?.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORIAL)
    .map((m) => ({
      direction: m.direction === 'out' ? 'out' : 'in',
      text: m.text.trim().slice(0, MAX_TEXTO),
    }))

  const ultimo = limpios[limpios.length - 1]
  if (!ultimo || ultimo.direction !== 'in') return { error: 'sin-mensaje' }

  const [settings, products, conocimiento] = await Promise.all([
    getSettings(tenantId),
    getProducts(tenantId),
    getContenidoPorAgente(tenantId, [agentId]),
  ])

  const { category, canAutoSend, reply } = await classifyAndDraft({
    settings,
    products,
    agents: [agent],
    currentAgent: agent,
    history: limpios.slice(0, -1),
    text: ultimo.text,
    conocimiento,
  })

  // `canAutoSend` ya trae adentro el techo del interruptor del agente, así que
  // es literalmente la pregunta que se está probando: con este mensaje, ¿esto
  // salía solo o te quedaba como borrador? Lo que la prueba no puede contestar
  // es el día abierto y el horario, que se miran recién al enviar.
  return { agentKey: agent.key, category, canAutoSend, reply }
}
