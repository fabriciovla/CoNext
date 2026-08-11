import { Type, FunctionCallingConfigMode } from '@google/genai'
import { getClient, ROUTER_MODEL } from './client.js'

// Mismo truco que en classifyAndDraft: forzar una función con la lista de
// agentes como enum es la única forma de garantizar que la respuesta sea una
// key que realmente existe, sin parsear texto libre.
function buildFunction(agents) {
  return {
    name: 'elegir_agente',
    description: 'Elige qué agente de la tienda debe atender este mensaje.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agentKey: {
          type: Type.STRING,
          enum: agents.map((a) => a.key),
          description: 'Key del agente que debe tomar la conversación.',
        },
      },
      required: ['agentKey'],
    },
  }
}

function buildSystemPrompt(agents, currentAgent) {
  const roster = agents
    .map((a) => `  - ${a.key} (${a.name}): ${a.role || 'sin criterio definido'}`)
    .join('\n')

  return `Sos el ruteador de la bandeja de atención de una tienda. Tu única tarea es elegir cuál de estos agentes debe responder el último mensaje del cliente.

AGENTES DISPONIBLES:
${roster}

${
  currentAgent
    ? `La conversación la viene atendiendo "${currentAgent.key}". Mantenelo salvo que el último mensaje claramente cambie de tema hacia el criterio de otro agente (por ejemplo, una consulta de precio que pasa a ser un reclamo).`
    : 'La conversación todavía no tiene agente asignado.'
}

Elegí en base al criterio de entrada de cada agente y al último mensaje, no al historial completo. Si ninguno encaja con claridad, elegí el primero de la lista.`
}

export async function routeAgent({ agents, currentAgent, history, text }) {
  // Con un solo agente habilitado no hay nada que decidir: ahorramos la llamada.
  if (agents.length <= 1) return agents[0] ?? null

  // Al ruteador le alcanza con el final del hilo: lo que importa es hacia dónde
  // viró la conversación recién, no todo lo que se dijo antes.
  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.direction === 'in' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text }] },
  ]

  const declaration = buildFunction(agents)
  const response = await getClient().models.generateContent({
    model: ROUTER_MODEL,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(agents, currentAgent),
      tools: [{ functionDeclarations: [declaration] }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: [declaration.name],
        },
      },
    },
  })

  const call = response.functionCalls?.[0]
  const chosen = agents.find((a) => a.key === call?.args?.agentKey)
  return chosen ?? agents[0]
}
