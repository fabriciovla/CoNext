import { Type, FunctionCallingConfigMode } from '@google/genai'
import { getClient, DRAFT_MODEL } from './client.js'
import { buildSystemPrompt } from './systemPrompt.js'
import { markdownToWhatsapp } from './whatsappFormat.js'

// Forcing a single function call (ANY mode + one declared function) is the
// stable way to get JSON-shaped output from Gemini: the model has no choice
// but to fill this exact schema, so there's no free-text parsing to fall over.
//
// El agentKey viaja en el mismo esquema que la redacción: elegir agente y
// escribir eran dos llamadas al modelo por cada mensaje entrante, y la segunda
// no podía arrancar hasta que volviera la primera. Unificarlas parte al medio
// el consumo de cuota y el tiempo que espera el cliente.
function buildFunction(agents) {
  return {
    name: 'classify_and_draft',
    description: 'Elige el agente que atiende, clasifica el mensaje entrante y redacta la respuesta.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agentKey: {
          type: Type.STRING,
          enum: agents.map((a) => a.key),
          description: 'Key del agente que debe tomar la conversación y firmar el tono de la respuesta.',
        },
        category: {
          type: Type.STRING,
          enum: ['automatico', 'pendiente'],
          description: 'automatico = se resuelve con la info del catálogo/horarios; pendiente = requiere criterio humano.',
        },
        canAutoSend: {
          type: Type.BOOLEAN,
          description: 'true solo si la respuesta es segura y está completa para enviarse sin revisión.',
        },
        reply: {
          type: Type.STRING,
          description: 'Respuesta redactada lista para enviar al cliente.',
        },
      },
      required: ['agentKey', 'category', 'canAutoSend', 'reply'],
    },
  }
}

export async function classifyAndDraft({ settings, products, agents, currentAgent, history, text }) {
  const contents = [
    ...history.map((m) => ({
      role: m.direction === 'in' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text }] },
  ]

  const declaration = buildFunction(agents)
  const response = await getClient().models.generateContent({
    model: DRAFT_MODEL,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(settings, products, agents, currentAgent),
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
  if (!call) throw new Error('El modelo no devolvió una clasificación estructurada')

  const { agentKey, category, canAutoSend, reply } = call.args

  // El enum no garantiza que la key exista de verdad, así que se resuelve
  // contra la lista: si el modelo inventa una, cae en el agente que ya venía
  // atendiendo o en el primero, igual que hacía el ruteador.
  const agent = agents.find((a) => a.key === agentKey) ?? currentAgent ?? agents[0]

  // El interruptor de envío automático del agente es un techo, no una
  // sugerencia: si está apagado, la respuesta queda como borrador para revisar
  // por más seguro que se haya sentido el modelo.
  //
  // La traducción de formato va acá y no en el adapter de WhatsApp porque de
  // este `reply` salen dos cosas: el mensaje que se manda y el borrador que
  // queda en `ai_draft`. Traduciendo recién al enviar, el borrador que revisa
  // una persona seguiría mostrando los asteriscos de Markdown.
  return {
    agent,
    category,
    canAutoSend: canAutoSend && agent?.autoSend !== false,
    reply: markdownToWhatsapp(reply),
  }
}
