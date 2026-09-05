// Copy de las tres comparativas. Vive aparte de ui.js por el mismo motivo
// que producto.js: cada página trae varias secciones.

function pagina({ nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }) {
  return { nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }
}

export const compararEs = {
  verTambien: 'Otras comparativas',
  enLaPractica: 'Cómo decidir',
  ctaTitulo: '¿Querés verlo con tus conversaciones?',
  ctaTexto: 'Siete días del Estándar completo, con tu catálogo cargado y los tres canales conectados.',
  ctaBoton: 'Empezar gratis',
  indice: {
    nombre: 'Comparar',
    etiqueta: 'Comparativas',
    title: 'Conext vs Respond.io, Wati y Manychat',
    description:
      'En qué se diferencia Conext de Respond.io, Wati y Manychat. Un CRM de bandeja para pymes, no un bot de marketing ni una plataforma enterprise.',
    titulo: 'Conext, al lado de las alternativas.',
    bajada:
      'Tres herramientas que suelen aparecer en la misma búsqueda. No hacen el mismo trabajo. Estas páginas dicen cuál es el de cada una.',
    intro:
      'Conext es el CRM que junta WhatsApp, Instagram y Messenger en una bandeja y deja que la IA conteste con tu catálogo, o te deje el borrador. Si lo que buscás es un constructor de flujos, un megáfono de campañas o un contact center de veinte canales, hay productos que nacieron para eso.',
  },
  paginas: {
    'conext-vs-respondio': pagina({
      nombre: 'Conext vs Respond.io',
      menu: 'Más simple que un contact center',
      title: 'Conext vs Respond.io: CRM para pymes, no plataforma enterprise',
      description:
        'Respond.io es una plataforma omnichannel pensada para equipos grandes. Conext es el CRM de WhatsApp, Instagram y Messenger para una pyme, con agentes de IA y sin un proyecto de implementación.',
      titulo: 'La misma bandeja. No el mismo proyecto.',
      bajada:
        'Respond.io cubre muchos canales y arma flujos de contact center. Conext cubre los tres de Meta y se configura como un negocio: catálogo, horarios, agentes.',
      intro:
        'Las dos unen chats en un solo lugar. La diferencia es para quién está armado el producto y cuánto hay que montar antes de atender el primer mensaje.',
      secciones: [
        {
          titulo: 'Respond.io es un contact center. Conext es el mostrador.',
          parrafos: [
            'Respond.io entra en la conversación cuando el equipo ya tiene varios canales (WhatsApp, mail, Telegram, SMS, webchat) y necesita enrutamiento, SLA y un onboarding de plataforma. Eso tiene sentido en una empresa con alguien dedicado a “operaciones de atención”. En una pyme, esa persona no existe: el dueño atiende entre un pedido y el otro.',
            'Conext nace de ese mostrador. WhatsApp, Instagram y Messenger —los tres que ya usa el cliente— caen en una bandeja. Los agentes de IA contestan precios, stock y envíos con el catálogo cargado, o dejan el texto listo. No hay que dibujar un flujo por cada pregunta de siempre.',
          ],
        },
        {
          titulo: 'La IA de Conext mira el negocio, no un árbol.',
          parrafos: [
            'En Conext cada agente tiene un rol escrito en español y el catálogo a la vista. Una sola llamada al modelo elige quién atiende, si puede salir solo y cómo se responde. El interruptor de envío automático es por agente: ventas puede esperar tu OK y envíos salir solo.',
            'Respond.io tiene automatizaciones y asistentes, pensados como piezas de una plataforma más ancha. Si necesitás diez canales y un constructor de workflows con condiciones anidadas, esa es su cancha. Si lo que querés es que “¿tenés talle M?” no te despierte a las once de la noche, Conext ya lo resuelve con el stock que cargaste.',
          ],
        },
        {
          titulo: 'La vía es la API oficial. El número es tuyo.',
          parrafos: [
            'Conext entra por la Cloud API de Meta. El número y la Página son del negocio: si un día te vas, te los llevás. No hay que clonar la sesión de WhatsApp Web ni dejar un teléfono enchufado. Meta cobra las conversaciones a tu cuenta, con su tarifa; acá se paga el software.',
            'La configuración vive en el CRM: Canales, un agente, el catálogo. No hay un proyecto de implementación ni un especialista que te arme los espacios. Por eso el plan arranca en una prueba de una semana, no en una cotización enterprise.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Contá los canales que de verdad usás', texto: 'Si son WhatsApp, Instagram y Messenger, Conext los cubre. Si además hace falta mail, SMS y un bot de la web, Respond.io está hecho para eso.' },
        { titulo: 'Mirá quién lo va a configurar', texto: 'Si es el dueño entre un pedido y el otro, un CRM de catálogo y agentes entra. Un contact center pide a alguien que lo administre.' },
        { titulo: 'Probalas con tus preguntas', texto: 'Una semana con el catálogo real dice más que una tabla de funciones. Las dos herramientas se ven distintas cuando contestan lo tuyo.' },
      ],
      cierre:
        'Respond.io es la herramienta correcta para un equipo de atención con muchos canales. Conext es la correcta para la pyme que ya atiende por Meta y no quiere un segundo trabajo de configurar una plataforma.',
    }),
    'conext-vs-wati': pagina({
      nombre: 'Conext vs Wati',
      menu: 'WhatsApp, y también Instagram',
      title: 'Conext vs Wati: WhatsApp e Instagram en la misma bandeja',
      description:
        'Wati está pensado alrededor de WhatsApp: campañas, chatbots y una bandeja compartida. Conext une WhatsApp, Instagram y Messenger con agentes de IA que contestan con tu catálogo.',
      titulo: 'Wati es de WhatsApp. Conext es de los tres canales.',
      bajada:
        'Si el trabajo es mandar campañas por WhatsApp y armar un bot de menús, Wati nació para eso. Si el trabajo es atender DMs de Instagram y WhatsApp en el mismo hilo, con stock a la vista, es Conext.',
      intro:
        'Las dos corren sobre la API oficial de WhatsApp Business. A partir de ahí se parten: una se queda en ese canal y empuja difusión; la otra abre Instagram y Messenger y empuja la atención del día.',
      secciones: [
        {
          titulo: 'El cliente no escribe solo por WhatsApp.',
          parrafos: [
            'Wati se construyó como herramienta de WhatsApp: plantillas, listas, chatbots de flujo, bandeja para el equipo. Eso sirve cuando el negocio ya concentró la atención en un número y quiere disparar campañas sobre esa base.',
            'En Conext el mismo contacto puede escribir por Instagram a la tarde y por WhatsApp a la noche. El hilo es uno. El agente ve el catálogo y no pregunta dos veces el talle. Wati puede sumar otros canales; el producto y la búsqueda siguen siendo de WhatsApp. Conext pone los tres de Meta en el mismo lugar desde el primer día.',
          ],
        },
        {
          titulo: 'Bot de menús contra agente con catálogo.',
          parrafos: [
            'El chatbot de Wati es un árbol: palabras clave, botones, el cliente elige 1, 2 o 3. Funciona para un menú cerrado. Se rompe cuando alguien pregunta “¿la campera de jean en M, y me hacen precio con la de cuero?”.',
            'Los agentes de Conext no recorren un árbol. Leés el rol en español, cargás productos con precio y stock, y el modelo redacta. Lo seguro sale solo; lo que toca un descuento queda de borrador. No hay que redibujar el flujo cada vez que cambia un precio.',
          ],
        },
        {
          titulo: 'La bandeja es de atender, no de disparar.',
          parrafos: [
            'Wati brilla cuando hay que salir a buscar al cliente: listas, broadcast, plantillas masivas. Conext brilla cuando el cliente ya escribió: pendientes, asignación, notas internas, el día medido. Las plantillas de WhatsApp existen en Conext porque pasadas las 24 horas Meta no deja mandar texto libre; no son el producto, son la puerta que Meta pide.',
            'Si tu prioridad es una campaña semanal a diez mil números, Wati está más cerca. Si tu prioridad es que no se pierda el DM de Instagram de las tres de la tarde, Conext está más cerca.',
          ],
        },
      ],
      pasos: [
        { titulo: '¿De dónde te escriben hoy?', texto: 'Solo WhatsApp, Wati cubre. WhatsApp más Instagram o Messenger, Conext los junta sin un segundo producto.' },
        { titulo: '¿El trabajo es salir o atender?', texto: 'Campañas y listas apuntan a Wati. Contestar lo que ya entra, con stock y un equipo chico, apunta a Conext.' },
        { titulo: 'Probá con una pregunta real', texto: 'Mandá el mensaje que más te cansa repetir. Si hace falta un menú de botones, un árbol alcanza. Si hace falta el catálogo, hace falta un agente.' },
      ],
      cierre:
        'Wati es una herramienta de WhatsApp con campañas y bots. Conext es el CRM de los tres canales de Meta, con la IA adentro de la bandeja y no al costado.',
    }),
    'conext-vs-manychat': pagina({
      nombre: 'Conext vs Manychat',
      menu: 'CRM de ventas, no bot de crecimiento',
      title: 'Conext vs Manychat: bandeja de equipo, no automatización de marketing',
      description:
        'Manychat es un bot de marketing: comentarios, historias, secuencias y crecimiento. Conext es un CRM con bandeja para el equipo de ventas, agentes de IA y los DMs de WhatsApp e Instagram.',
      titulo: 'Manychat crece la audiencia. Conext atiende a quien ya escribió.',
      bajada:
        'Si el trabajo es convertir un comentario de Instagram en un embudo, Manychat nació para eso. Si el trabajo es que ventas vea el mismo hilo que el agente y no pierda un DM, es Conext.',
      intro:
        'Las dos tocan Instagram y WhatsApp. Una lo hace para captar. La otra, para no dejar plantado a quien ya preguntó el precio.',
      secciones: [
        {
          titulo: 'Un bot de marketing no es una bandeja de equipo.',
          parrafos: [
            'Manychat arma flujos visuales: el comentario dispara un DM, la historia dispara una secuencia, el contacto entra a un embudo. Es crecimiento. El inbox existe, pero el producto se mide por automatizar la captación, no por el turno de tres personas que se pasan un hilo.',
            'Conext no responde comentarios ni menciones de historias. El webhook mira mensajes de texto en el chat: WhatsApp, Instagram Direct, Messenger. Lo que entra va a una bandeja con carpetas, asignación y notas que el cliente no ve. El trabajo es el del mostrador, no el de la campaña.',
          ],
        },
        {
          titulo: 'La IA de Conext vende con el stock. No con un embudo.',
          parrafos: [
            'En Manychat el bot dice lo que le escribiste en el lienzo. Si cambia el precio, hay que tocar el flujo. En Conext el precio vive en el catálogo; el agente lo cita. Un interruptor por agente decide si esa respuesta sale sola o espera que la mire alguien de ventas.',
            'Manychat es fuerte cuando el objetivo es una secuencia: bienvenida, recordatorio, cierre. Conext es fuerte cuando el objetivo es no contradecir el stock y no mandar solo lo que toca plata. Son dos formas de “automatizar” que no se reemplazan.',
          ],
        },
        {
          titulo: 'El equipo entra al mismo número, no a un bot aparte.',
          parrafos: [
            'En Conext varias personas atienden el mismo WhatsApp, cada una con su usuario. Lo pendiente está marcado. El responsable se ve. El cliente recibe un mensaje del negocio, sin un cartel de “estás hablando con un flujo”.',
            'Si lo que necesitás es crecer por comentarios y anuncios, Manychat sigue siendo la herramienta de esa pata. Conext no pretende serla. Si lo que necesitás es que el DM de quien ya compró no se pierda entre el teléfono de la caja y el de la dueña, esa es la bandeja.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Separá captar de atender', texto: 'Comentarios, historias y secuencias son Manychat. DMs del día, stock y un equipo en un número son Conext.' },
        { titulo: 'Mirá quién tiene que ver el hilo', texto: 'Si ventas y el local tienen que retomar la misma conversación, hace falta una bandeja. Un lienzo de flujos no es eso.' },
        { titulo: 'No las uses para el trabajo de la otra', texto: 'Un CRM no va a multiplicar comentarios. Un bot de crecimiento no va a ser el turno de la tarde. Probá la que sí corresponde.' },
      ],
      cierre:
        'Manychat es el bot de marketing. Conext es el CRM de la bandeja. Se pueden cruzar en Instagram; no se sustituyen.',
    }),
  },
}

export const compararEn = {
  verTambien: 'Other comparisons',
  enLaPractica: 'How to decide',
  ctaTitulo: 'Want to see it with your own threads?',
  ctaTexto: 'Seven days of the full Standard plan, with your catalog loaded and all three channels connected.',
  ctaBoton: 'Start for free',
  indice: {
    nombre: 'Compare',
    etiqueta: 'Comparisons',
    title: 'Conext vs Respond.io, Wati, and Manychat',
    description:
      'How Conext differs from Respond.io, Wati, and Manychat. An inbox CRM for small businesses, not a marketing bot or an enterprise platform.',
    titulo: 'Conext, next to the alternatives.',
    bajada:
      'Three tools that show up in the same search. They do not do the same job. These pages say which job is whose.',
    intro:
      'Conext is the CRM that puts WhatsApp, Instagram, and Messenger in one inbox and lets AI reply from your catalog, or leave you the draft. If what you want is a flow builder, a broadcast megaphone, or a twenty-channel contact center, there are products that were born for that.',
  },
  paginas: {
    'conext-vs-respondio': pagina({
      nombre: 'Conext vs Respond.io',
      menu: 'Simpler than a contact center',
      title: 'Conext vs Respond.io: a CRM for small businesses, not an enterprise platform',
      description:
        'Respond.io is an omnichannel platform built for larger teams. Conext is the WhatsApp, Instagram, and Messenger CRM for a small business, with AI agents and no implementation project.',
      titulo: 'The same kind of inbox. Not the same project.',
      bajada:
        'Respond.io covers many channels and builds contact-center flows. Conext covers Meta’s three and is set up like a shop: catalog, hours, agents.',
      intro:
        'Both put chats in one place. The difference is who the product is built for, and how much you have to set up before the first message is answered.',
      secciones: [
        {
          titulo: 'Respond.io is a contact center. Conext is the counter.',
          parrafos: [
            'Respond.io enters the conversation when the team already has several channels (WhatsApp, email, Telegram, SMS, webchat) and needs routing, SLAs, and a platform onboarding. That makes sense in a company with someone dedicated to support operations. In a small business that person does not exist: the owner answers between one order and the next.',
            'Conext comes from that counter. WhatsApp, Instagram, and Messenger —the three the customer already uses— land in one inbox. AI agents answer prices, stock, and shipping from the catalog you loaded, or leave the text ready. You do not draw a flow for every recurring question.',
          ],
        },
        {
          titulo: 'Conext’s AI looks at the business, not a tree.',
          parrafos: [
            'In Conext each agent has a role written in plain language and the catalog in view. One model call picks who handles it, whether it can go out on its own, and how to reply. The auto-send switch is per agent: sales can wait for your OK and shipping can go out alone.',
            'Respond.io has automations and assistants, built as pieces of a wider platform. If you need ten channels and a workflow builder with nested conditions, that is their field. If you want “do you have size M?” not to wake you at eleven, Conext already handles it with the stock you loaded.',
          ],
        },
        {
          titulo: 'The path is the official API. The number is yours.',
          parrafos: [
            'Conext comes in through Meta’s Cloud API. The number and the Page belong to the business: if you leave one day, you take them with you. There is no cloning a WhatsApp Web session or leaving a phone plugged in. Meta bills conversations to your account at their rate; here you pay for the software.',
            'Setup lives in the CRM: Channels, an agent, the catalog. There is no implementation project and no specialist to assemble the workspaces. That is why the plan starts with a one-week trial, not an enterprise quote.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Count the channels you actually use', texto: 'If they are WhatsApp, Instagram, and Messenger, Conext covers them. If you also need email, SMS, and a website bot, Respond.io was built for that.' },
        { titulo: 'Look at who will configure it', texto: 'If it is the owner between orders, a catalog-and-agents CRM fits. A contact center asks for someone to run it.' },
        { titulo: 'Try them with your questions', texto: 'A week with the real catalog says more than a feature table. The two tools look different when they answer yours.' },
      ],
      cierre:
        'Respond.io is the right tool for a support team with many channels. Conext is the right one for the small business that already attends on Meta and does not want a second job of configuring a platform.',
    }),
    'conext-vs-wati': pagina({
      nombre: 'Conext vs Wati',
      menu: 'WhatsApp, and Instagram too',
      title: 'Conext vs Wati: WhatsApp and Instagram in the same inbox',
      description:
        'Wati is built around WhatsApp: campaigns, chatbots, and a shared inbox. Conext brings WhatsApp, Instagram, and Messenger together with AI agents that reply from your catalog.',
      titulo: 'Wati is WhatsApp. Conext is the three channels.',
      bajada:
        'If the job is sending WhatsApp campaigns and building a menu bot, Wati was born for that. If the job is answering Instagram and WhatsApp DMs in the same thread, with stock in view, it is Conext.',
      intro:
        'Both run on the official WhatsApp Business API. From there they split: one stays on that channel and pushes outreach; the other opens Instagram and Messenger and pushes the day’s attention.',
      secciones: [
        {
          titulo: 'Customers do not only write on WhatsApp.',
          parrafos: [
            'Wati was built as a WhatsApp tool: templates, lists, flow chatbots, a team inbox. That works when the business already concentrated attention on one number and wants to fire campaigns on that base.',
            'In Conext the same contact can write on Instagram in the afternoon and on WhatsApp at night. The thread is one. The agent sees the catalog and does not ask for the size twice. Wati can add other channels; the product and the search are still WhatsApp’s. Conext puts Meta’s three in the same place from day one.',
          ],
        },
        {
          titulo: 'A menu bot versus an agent with a catalog.',
          parrafos: [
            'Wati’s chatbot is a tree: keywords, buttons, the customer picks 1, 2, or 3. It works for a closed menu. It breaks when someone asks “the denim jacket in M, and can you do a price with the leather one?”.',
            'Conext agents do not walk a tree. You write the role in plain language, load products with price and stock, and the model drafts. What is safe goes out on its own; anything that touches a discount stays a draft. You do not redraw the flow every time a price changes.',
          ],
        },
        {
          titulo: 'The inbox is for answering, not blasting.',
          parrafos: [
            'Wati shines when you go out to find the customer: lists, broadcasts, bulk templates. Conext shines when the customer already wrote: pending, assignment, internal notes, the day measured. WhatsApp templates exist in Conext because after 24 hours Meta will not let free text through; they are not the product, they are the door Meta asks for.',
            'If your priority is a weekly campaign to ten thousand numbers, Wati is closer. If your priority is not losing the 3 p.m. Instagram DM, Conext is closer.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Where do people write you today?', texto: 'WhatsApp only, Wati covers it. WhatsApp plus Instagram or Messenger, Conext joins them without a second product.' },
        { titulo: 'Is the job outreach or answering?', texto: 'Campaigns and lists point to Wati. Answering what already comes in, with stock and a small team, points to Conext.' },
        { titulo: 'Try it with a real question', texto: 'Send the message you are tired of repeating. If a button menu is enough, a tree is enough. If the catalog is needed, an agent is needed.' },
      ],
      cierre:
        'Wati is a WhatsApp tool with campaigns and bots. Conext is the CRM for Meta’s three channels, with the AI inside the inbox and not beside it.',
    }),
    'conext-vs-manychat': pagina({
      nombre: 'Conext vs Manychat',
      menu: 'A sales CRM, not a growth bot',
      title: 'Conext vs Manychat: a team inbox, not marketing automation',
      description:
        'Manychat is a marketing bot: comments, stories, sequences, and growth. Conext is a CRM with a team inbox, AI agents, and WhatsApp and Instagram DMs.',
      titulo: 'Manychat grows the audience. Conext answers whoever already wrote.',
      bajada:
        'If the job is turning an Instagram comment into a funnel, Manychat was born for that. If the job is sales seeing the same thread as the agent and not losing a DM, it is Conext.',
      intro:
        'Both touch Instagram and WhatsApp. One does it to capture. The other, so the person who already asked the price is not left hanging.',
      secciones: [
        {
          titulo: 'A marketing bot is not a team inbox.',
          parrafos: [
            'Manychat builds visual flows: a comment triggers a DM, a story triggers a sequence, the contact enters a funnel. That is growth. An inbox exists, but the product is measured by automating capture, not by the three-person shift handing off a thread.',
            'Conext does not reply to comments or story mentions. The webhook looks at text messages in the chat: WhatsApp, Instagram Direct, Messenger. What comes in goes to an inbox with folders, assignment, and notes the customer does not see. The job is the counter’s, not the campaign’s.',
          ],
        },
        {
          titulo: 'Conext’s AI sells with stock. Not with a funnel.',
          parrafos: [
            'In Manychat the bot says what you wrote on the canvas. If the price changes, you touch the flow. In Conext the price lives in the catalog; the agent cites it. A switch per agent decides whether that reply goes out on its own or waits for someone in sales to look.',
            'Manychat is strong when the goal is a sequence: welcome, reminder, close. Conext is strong when the goal is not contradicting stock and not auto-sending anything that touches money. Those are two kinds of “automation” that do not replace each other.',
          ],
        },
        {
          titulo: 'The team joins the same number, not a separate bot.',
          parrafos: [
            'In Conext several people attend the same WhatsApp, each with their own user. What is pending is marked. The owner is visible. The customer gets a message from the business, with no banner that says “you are talking to a flow”.',
            'If what you need is growth from comments and ads, Manychat is still the tool for that leg. Conext does not pretend to be it. If what you need is that a DM from someone who already bought does not get lost between the till phone and the owner’s, that is the inbox.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Split capture from answering', texto: 'Comments, stories, and sequences are Manychat. The day’s DMs, stock, and a team on one number are Conext.' },
        { titulo: 'Look at who has to see the thread', texto: 'If sales and the shop have to pick up the same conversation, you need an inbox. A flow canvas is not that.' },
        { titulo: 'Do not use either for the other’s job', texto: 'A CRM will not multiply comments. A growth bot will not be the afternoon shift. Try the one that actually fits.' },
      ],
      cierre:
        'Manychat is the marketing bot. Conext is the inbox CRM. They can overlap on Instagram; they do not substitute for each other.',
    }),
  },
}
