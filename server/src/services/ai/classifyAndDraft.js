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
        // Va **antes** de `reply` a propósito: el modelo llena el objeto en
        // orden, así que nombrar el idioma primero lo obliga a decidirlo antes
        // de empezar a redactar. Pedirlo después no serviría —ya escribió— y
        // pedirlo solo por prompt tampoco alcanzaba: con el setting en 'auto',
        // un mensaje en portugués volvía contestado en español, porque el
        // prompt entero está en español y el modelo lo arrastra. Declararlo
        // como un campo obligatorio es lo que corta ese arrastre.
        //
        // No se guarda ni se muestra: existe para forzar la decisión.
        replyLanguage: {
          type: Type.STRING,
          description:
            'Idioma en el que está escrito el ÚLTIMO mensaje del cliente, en dos letras ' +
            '(es, en, pt, it, fr…). Es el idioma en el que tiene que salir "reply" cuando el ' +
            'negocio pidió responder en el idioma del cliente. Portugués y español son distintos: ' +
            'un mensaje con "olá", "vocês", "obrigado" o "o que" es pt, no es.',
        },
        reply: {
          type: Type.STRING,
          description:
            'Respuesta redactada lista para enviar al cliente, escrita en el idioma de replyLanguage.',
        },
      },
      required: ['agentKey', 'category', 'canAutoSend', 'replyLanguage', 'reply'],
    },
  }
}


// Segunda pasada: reescribe la respuesta en el idioma del cliente.
//
// Existe porque con el setting en 'auto' el prompt **no alcanza**, y no por
// falta de instrucciones. Se midió: el modelo detecta bien el idioma —devuelve
// `replyLanguage: 'fr'` para un mensaje en francés— y redacta en español
// igual. Se probó decirlo más fuerte, nombrar los idiomas uno por uno y mover
// el bloque al final del prompt, que es la posición que más pesa: mejoró y
// siguió fallando una de cada dos veces. Contra un contexto entero en español
// —el catálogo, el mensaje de bienvenida, las instrucciones de los agentes— una
// línea que pide otro idioma no gana de forma confiable.
//
// Traducir aparte sí, porque el pedido es uno solo y no compite con nada.
//
// Solo corre cuando hace falta: con 'auto' y con un cliente que escribió en
// otro idioma que el español. Un negocio argentino recibe casi todo en español,
// así que en la práctica esta llamada no se hace casi nunca.
//
// Si falla, se devuelve el original. Una respuesta en el idioma equivocado es
// mucho mejor que ninguna.
async function reescribirEnIdioma(texto, idioma) {
  try {
    const r = await getClient().models.generateContent({
      model: DRAFT_MODEL,
      contents: [{ role: 'user', parts: [{ text: texto }] }],
      config: {
        systemInstruction:
          `Traducí el mensaje del usuario al idioma con código "${idioma}". Devolvé SOLO el mensaje ` +
          `traducido, sin comillas, sin explicaciones y sin agregar ni sacar nada. ` +
          `Si ya está en ese idioma, devolvelo igual. ` +
          `Respetá el formato de WhatsApp tal cual está: *negrita* con un asterisco, _itálica_, ` +
          `los saltos de línea y las listas que arrancan con "- ". ` +
          `Los nombres de los productos y los precios no se traducen ni se convierten: van tal cual. ` +
          `Usá la puntuación del idioma de destino: los signos de apertura "¡" y "¿" son del español ` +
          `y no van en ningún otro.`,
      },
    })
    return r.text?.trim() || texto
  } catch (err) {
    console.warn('[ai] no se pudo traducir la respuesta:', err.message)
    return texto
  }
}

export async function classifyAndDraft({
  settings,
  products,
  agents,
  currentAgent,
  history,
  text,
  // Lo que se subió para entrenar a cada agente, por key. Ver `systemPrompt`.
  conocimiento = {},
}) {
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
      systemInstruction: buildSystemPrompt(settings, products, agents, currentAgent, conocimiento),
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

  const { agentKey, category, canAutoSend, replyLanguage, reply } = call.args

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
  // Ver `reescribirEnIdioma`: con 'auto' el prompt detecta el idioma pero no
  // lo obedece, así que cuando el cliente no escribió en español la traducción
  // se pide aparte.
  const enIdioma =
    settings?.aiLanguage === 'auto' && replyLanguage && !/^es/i.test(replyLanguage)
      ? await reescribirEnIdioma(reply, replyLanguage)
      : reply

  return {
    agent,
    category,
    canAutoSend: canAutoSend && agent?.autoSend !== false,
    reply: markdownToWhatsapp(enIdioma),
  }
}
