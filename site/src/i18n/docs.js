function pagina({ nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }) {
  return { nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }
}

export const docsEs = {
  verTambien: 'Otras guías',
  enLaPractica: 'En la práctica',
  ctaTitulo: '¿Querés verlo con tus conversaciones?',
  ctaTexto: 'Siete días del Estándar completo, con tu catálogo cargado y los tres canales conectados.',
  ctaBoton: 'Empezar gratis',
  indice: {
    nombre: 'Documentación',
    etiqueta: 'Documentación',
    title: 'Documentación | Conext',
    description:
      'Cómo conectar WhatsApp e Instagram, configurar los agentes de IA y qué hace Conext con los webhooks de Meta. Guías cortas, no un manual enterprise.',
    titulo: 'Lo que hace falta para atender el primer mensaje.',
    bajada:
      'Conectar los canales, decirle a la IA cómo habla el negocio, y entender qué eventos entran. El resto del día a día está en Ayuda.',
    intro:
      'Estas tres guías son el camino de puesta en marcha. Facturación, cuentas y borrado de datos viven en el centro de ayuda; acá está lo que hay que tocar para que un “hola” aparezca en la bandeja y tenga respuesta.',
  },
  paginas: {
    'primeros-pasos': pagina({
      nombre: 'Guía de inicio rápido',
      menu: 'Conectar canales y atender',
      title: 'Primeros pasos | Conext',
      description:
        'Cómo conectar WhatsApp Business y la Página de Instagram y Messenger en Conext, cargar el catálogo y dejar un agente listo para el primer mensaje.',
      titulo: 'Del alta al primer mensaje, sin un proyecto.',
      bajada:
        'La conexión en el CRM es corta. Lo que puede alargar el día es el lado de Meta: la WABA, la Página y, en producción, el App Review.',
      intro:
        'Conext no pide un servidor ni un webhook tuyo. Pedís el acceso, entrás, y en Configuración están las dos fichas: WhatsApp, e Instagram con Messenger.',
      secciones: [
        {
          titulo: 'Antes de conectar.',
          parrafos: [
            'Hace falta una cuenta de Meta Business, un WhatsApp Business (el número que vas a atender) y, si querés Instagram o Messenger, una Página de Facebook con la cuenta profesional atada. Un número en la Cloud API no puede estar al mismo tiempo en la app del teléfono: si hoy lo atendés a mano, el camino cómodo es un número de prueba y pasar el principal después.',
            'El alta de Conext sale de Precios: se elige un plan y se entra. La pestaña de crear cuenta en el ingreso no abre un registro. Con el acceso, el primer día de trabajo ya está abierto: sin día abierto no se envía ni se deja una nota.',
          ],
        },
        {
          titulo: 'Las dos fichas de Canales.',
          parrafos: [
            'WhatsApp se enlaza con el alta embebida de Meta. Quedan el token (cifrado) y el `phone_number_id`. Instagram y Messenger se enlazan por la Página, con un solo token para las dos. Una Página sin Instagram atado deja Messenger andando; la ficha avisa, no falla.',
            'Conectar no alcanza si en la consola de Meta la app no está suscrita a `messages`. Es el mismo silencio de los dos lados: la tarjeta dice conectado y no entra ni un mensaje. Un “hola” de prueba al número o un Direct a la cuenta es lo que confirma que el camino está entero.',
          ],
        },
        {
          titulo: 'Catálogo, horario, un agente.',
          parrafos: [
            'Los agentes contestan con lo que está cargado. Un producto con precio y stock, los días y el horario, y un agente con el rol escrito en español alcanzan para que “¿tenés talle M?” no quede en visto. El idioma de las respuestas se elige en Configuración: español, inglés, portugués, o el del cliente.',
            'Las primeras semanas conviene dejar el envío automático apagado. El borrador aparece en el hilo, lo editás y lo mandás. Cuando un tema ya sale bien, le prendés el interruptor solo a ese agente.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Conectás WhatsApp', texto: 'Configuración → Canales. El número queda en tu cuenta de Meta. Un mensaje de prueba tiene que verse en la bandeja.' },
        { titulo: 'Conectás la Página, si aplica', texto: 'La misma pantalla, la ficha de Instagram y Messenger. Un Direct de prueba confirma ese lado.' },
        { titulo: 'Cargás lo que la IA va a citar', texto: 'Productos, horario, un agente. Sin eso el modelo improvisa; con eso cita el talle y la hora de cierre.' },
      ],
      cierre:
        'Diez minutos es el CRM. El reloj de Meta (WABA, permisos, Review) es otro, y no se resuelve desde esta pantalla.',
    }),
    'configurar-ia': pagina({
      nombre: 'Configuración de agentes IA',
      menu: 'Rol, catálogo y cuándo sale solo',
      title: 'Configurar agentes de IA | Conext',
      description:
        'Cómo crear un agente en Conext, escribirle el rol, apoyarlo en el catálogo y decidir si manda solo o deja el borrador. El tono y el idioma son del negocio.',
      titulo: 'El agente es un rol escrito, no un flujo dibujado.',
      bajada:
        'No hay que cargar un PDF ni armar un árbol. Se escribe qué atiende, se cargan los productos, y un interruptor decide si esa respuesta sale sola.',
      intro:
        'Un agente de Conext es un nombre, un rol y un techo: si puede autoenviar. El modelo elige cuál atiende cada mensaje. Vos no tenés que ruteárselo.',
      secciones: [
        {
          titulo: 'El rol es el conocimiento.',
          parrafos: [
            'En Agentes creás uno por tema —recepción, ventas, envíos, posventa— y le escribís el rol en el idioma en que trabaja el local. Ahí va cómo saluda, qué puede prometer y qué tiene que pasar a una persona. No hay una base de artículos aparte: el catálogo, los horarios y este texto son lo que ve el modelo.',
            'El idioma de las respuestas es un setting del negocio, no del agente. Está en Configuración → Respuestas automáticas: `auto` (el del cliente), español, inglés o portugués. El tono “argentino” viaja adentro de cada idioma; pedirle inglés y voz de Buenos Aires a la vez se pelean.',
          ],
        },
        {
          titulo: 'El catálogo va a la misma llamada.',
          parrafos: [
            'Precio y stock se cargan en Productos, no en el prompt. Cuando el modelo redacta, los tiene a la vista: puede decir “sí, hay M” o “eso se acabó” sin que le armes una rama. Si el número está mal, la respuesta sale mal. Actualizar el stock es lo que corrige las dos pantallas a la vez.',
            'Los planes limitan cuántos productos entran. El gratis alcanza para probar. Lo que no cambia es que el equipo y la IA miran la misma lista.',
          ],
        },
        {
          titulo: 'El interruptor es el techo, no el piloto.',
          parrafos: [
            'Aunque el modelo marque que puede enviar, la respuesta no sale si el agente tiene el automático apagado, si el día está cerrado o si estás fuera de horario. Falta una, queda borrador en el hilo. Las primeras semanas ese es el camino: ves lo que escribiría, lo corregís, y recién ahí le das cuerda a un tema.',
            'La clasificación es `automatico` o `pendiente`. Pendiente es lo que pide una persona —un descuento, un enojo, algo que el catálogo no cubre—. No hace falta un flujo de “si dice reclamo, asignar a Ana”: el mensaje queda marcado y la carpeta Pendientes lo cuenta.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Creás el agente', texto: 'Nombre y rol. Ventas no tiene que saludar igual que envíos. El modelo elige entre los que existan.' },
        { titulo: 'Cargás lo que va a citar', texto: 'Productos con precio y stock, horario, el mensaje de fuera de hora. Sin eso, improvisa.' },
        { titulo: 'Dejás el automático apagado', texto: 'Hasta que el borrador ya no necesite tu mano. El interruptor es por agente, no para todo el CRM.' },
      ],
      cierre:
        'Configurar la IA en Conext es escribir cómo trabaja el negocio y cargar la góndola. El lienzo de flujos es de otra herramienta.',
    }),
    'webhooks-api': pagina({
      nombre: 'Referencia de webhooks',
      menu: 'Qué llega y qué se hace con eso',
      title: 'Referencia de webhooks | Conext',
      description:
        'Qué eventos de Meta procesa Conext, cómo se autentican y cómo se actualiza el estado de entrega. Referencia para quien conecta un canal, no una API para disparar hacia afuera.',
      titulo: 'Qué hace Conext con cada evento de Meta.',
      bajada:
        'No hay una API pública para empujar contactos a otro sistema. Esta página dice qué entra desde Meta, cómo se verifica y qué queda en la bandeja.',
      intro:
        'Una sola URL recibe a todos los clientes. El CRM no lee una API key en el webhook: Meta lo firma, y el negocio se resuelve por un id del payload.',
      secciones: [
        {
          titulo: 'Autenticación: la firma de Meta, no una clave tuya.',
          parrafos: [
            'El GET de verificación responde el `hub.challenge` si el `hub.verify_token` coincide con el de la app. El POST trae la firma HMAC en la cabecera de Meta; si no calza, se descarta. Eso lo resolvemos nosotros con el secreto de la app. Al conectar el canal no hay un token de webhook que copiar en un panel.',
            'Si el id del payload no pertenece a ningún negocio —un `phone_number_id`, un PAGE_ID o un IGID que nadie conectó— el evento se tira. No se adivina el destinatario.',
          ],
        },
        {
          titulo: 'Los tres objetos.',
          parrafos: [
            'WhatsApp llega con `object: whatsapp_business_account` y `entry[].changes[]`. El negocio sale de `value.metadata.phone_number_id`. El texto está en `messages[]` cuando `type` es `text`; cualquier otro tipo se ignora y queda logueado. Los acuses vienen en `statuses[]` (sent, delivered, read, failed) y nombran el wamid del saliente.',
            'Instagram y Messenger llegan con `entry[].messaging[]`. El `object` `instagram` resuelve por el IGID (`entry[].id`); el `object` `page`, por el PAGE_ID. Un `message.is_echo` se descarta. El id del contacto se guarda prefijado (`ig:…`, `fb:…`) para no chocar con un `wa_id` de la misma forma. En estos dos canales el acuse es una marca de agua: todo lo anterior a esa marca está entregado o leído, sin listar mensajes.',
          ],
        },
        {
          titulo: 'Estados, dedup y lo que no entra.',
          parrafos: [
            'El CRM responde 200 y procesa después, para que Meta no reintente por tiempo. El id del mensaje se inserta en una tabla de eventos; si ya estaba, no se vuelve a correr el pipeline. Un acuse que llega desordenado no puede bajar el estado: entregado no pisa a leído.',
            'No se procesan adjuntos entrantes, comentarios, menciones ni mensajes que no sean texto. No hay un webhook saliente hacia tu base, ni un esquema para Make o Zapier. Lo que queda en Conext es el hilo, el estado del globo y, si aplica, el borrador de la IA.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Conectás el canal en el CRM', texto: 'Ahí se guardan los ids. Sin ellos el webhook de Meta no tiene a quién atribuir el evento.' },
        { titulo: 'Meta POST-ea a nuestra URL', texto: 'Se verifica la firma. Se resuelve el negocio. Se responde 200.' },
        { titulo: 'El pipeline corre o se descarta', texto: 'Texto nuevo: se clasifica y se redacta. Acuse: se actualiza el globo. Eco, adjunto o id desconocido: no entra a la bandeja.' },
      ],
      cierre:
        'Esta referencia describe el camino de Meta hacia Conext. No es una API para que otro sistema nos escriba, ni un conector hacia afuera.',
    }),
  },
}

export const docsEn = {
  verTambien: 'Other guides',
  enLaPractica: 'In practice',
  ctaTitulo: 'Want to see it with your own threads?',
  ctaTexto: 'Seven days of the full Standard plan, with your catalog loaded and all three channels connected.',
  ctaBoton: 'Start for free',
  indice: {
    nombre: 'Docs',
    etiqueta: 'Documentation',
    title: 'Documentation | Conext',
    description:
      'How to connect WhatsApp and Instagram, set up AI agents, and what Conext does with Meta webhooks. Short guides, not an enterprise manual.',
    titulo: 'What it takes to answer the first message.',
    bajada:
      'Connect the channels, tell the AI how the business talks, and understand which events come in. Day-to-day questions live in Help.',
    intro:
      'These three guides are the setup path. Billing, accounts, and data deletion live in the help center; here is what you have to touch so a “hello” shows up in the inbox and gets a reply.',
  },
  paginas: {
    'primeros-pasos': pagina({
      nombre: 'Quick start',
      menu: 'Connect channels and start answering',
      title: 'Quick start | Conext',
      description:
        'How to connect WhatsApp Business and the Instagram and Messenger Page in Conext, load the catalog, and leave an agent ready for the first message.',
      titulo: 'From signup to the first message, without a project.',
      bajada:
        'The connection in the CRM is short. What can stretch the day is Meta’s side: the WABA, the Page, and, in production, App Review.',
      intro:
        'Conext does not ask for a server or a webhook of yours. You get access, sign in, and Settings has the two cards: WhatsApp, and Instagram with Messenger.',
      secciones: [
        {
          titulo: 'Before you connect.',
          parrafos: [
            'You need a Meta Business account, a WhatsApp Business number you will attend, and, if you want Instagram or Messenger, a Facebook Page with the professional account attached. A number on Cloud API cannot be on the phone app at the same time: if you still answer by hand, the comfortable path is a test number and moving the main one later.',
            'Conext access starts at Pricing: you pick a plan and you are in. The create-account tab on the login screen does not open a signup. With access, the first work day is already open: with no open day you cannot send or leave a note.',
          ],
        },
        {
          titulo: 'The two Channel cards.',
          parrafos: [
            'WhatsApp is linked with Meta’s embedded signup. The token (encrypted) and the `phone_number_id` are stored. Instagram and Messenger are linked through the Page, with one token for both. A Page with no Instagram attached still runs Messenger; the card warns, it does not fail.',
            'Connecting is not enough if in Meta’s console the app is not subscribed to `messages`. It is the same silence on both sides: the card says connected and not a single message comes in. A test “hello” to the number or a Direct to the account is what confirms the path is whole.',
          ],
        },
        {
          titulo: 'Catalog, hours, one agent.',
          parrafos: [
            'Agents reply with what is loaded. A product with price and stock, the days and hours, and an agent with the role written in plain language are enough so “do you have size M?” does not sit on read. Reply language is chosen in Settings: Spanish, English, Portuguese, or the customer’s.',
            'The first weeks it is better to leave auto-send off. The draft appears in the thread, you edit it and send it. When a topic already comes out right, you turn the switch on for that agent only.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Connect WhatsApp', texto: 'Settings → Channels. The number stays on your Meta account. A test message should show in the inbox.' },
        { titulo: 'Connect the Page, if it applies', texto: 'The same screen, the Instagram and Messenger card. A test Direct confirms that side.' },
        { titulo: 'Load what the AI will cite', texto: 'Products, hours, one agent. Without that the model improvises; with it, it cites the size and closing time.' },
      ],
      cierre:
        'Ten minutes is the CRM. Meta’s clock (WABA, permissions, Review) is another one, and it is not solved from this screen.',
    }),
    'configurar-ia': pagina({
      nombre: 'Set up AI agents',
      menu: 'Role, catalog, and when it sends alone',
      title: 'Set up AI agents | Conext',
      description:
        'How to create an agent in Conext, write its role, ground it in the catalog, and decide whether it sends on its own or leaves a draft. Tone and language belong to the business.',
      titulo: 'The agent is a written role, not a drawn flow.',
      bajada:
        'You do not upload a PDF or build a tree. You write what it handles, you load the products, and a switch decides whether that reply goes out on its own.',
      intro:
        'A Conext agent is a name, a role, and a ceiling: whether it can auto-send. The model picks which one handles each message. You do not have to route it.',
      secciones: [
        {
          titulo: 'The role is the knowledge.',
          parrafos: [
            'In Agents you create one per topic —front desk, sales, shipping, after-sales— and you write the role in the language the shop works in. That is how it greets, what it can promise, and what has to go to a person. There is no separate article base: the catalog, the hours, and this text are what the model sees.',
            'Reply language is a business setting, not an agent’s. It lives in Settings → Automatic replies: `auto` (the customer’s), Spanish, English, or Portuguese. An “Argentine” tone travels inside each language; asking for English and a Buenos Aires voice at once fights itself.',
          ],
        },
        {
          titulo: 'The catalog goes in the same call.',
          parrafos: [
            'Price and stock are loaded in Products, not in the prompt. When the model drafts, it has them in view: it can say “yes, there is an M” or “that’s gone” without a branch you built. If the number is wrong, the reply is wrong. Updating stock is what fixes both screens at once.',
            'Plans cap how many products go in the catalog. The free one is enough to try. What does not change is that the team and the AI look at the same list.',
          ],
        },
        {
          titulo: 'The switch is the ceiling, not the pilot.',
          parrafos: [
            'Even if the model marks that it can send, the reply does not go out if the agent has auto-send off, if the day is closed, or if you are outside hours. One missing, and it stays a draft in the thread. The first weeks that is the path: you see what it would write, you correct it, and only then you give a topic slack.',
            'Classification is `automatico` or `pendiente`. Pending is what needs a person —a discount, a complaint, something the catalog does not cover. You do not need a flow of “if they say claim, assign to Ana”: the message is marked and the Pending folder counts it.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Create the agent', texto: 'Name and role. Sales should not greet like shipping. The model chooses among the ones that exist.' },
        { titulo: 'Load what it will cite', texto: 'Products with price and stock, hours, the after-hours message. Without that, it improvises.' },
        { titulo: 'Leave auto-send off', texto: 'Until the draft no longer needs your hand. The switch is per agent, not for the whole CRM.' },
      ],
      cierre:
        'Setting up AI in Conext is writing how the business works and loading the shelf. The flow canvas belongs to another tool.',
    }),
    'webhooks-api': pagina({
      nombre: 'Webhook reference',
      menu: 'What arrives and what is done with it',
      title: 'Webhook reference | Conext',
      description:
        'Which Meta events Conext processes, how they are authenticated, and how delivery status is updated. A reference for whoever connects a channel, not an API to fire outbound.',
      titulo: 'What Conext does with each Meta event.',
      bajada:
        'There is no public API to push contacts into another system. This page says what comes in from Meta, how it is verified, and what stays in the inbox.',
      intro:
        'A single URL receives every customer. The CRM does not read an API key on the webhook: Meta signs it, and the business is resolved from an id in the payload.',
      secciones: [
        {
          titulo: 'Authentication: Meta’s signature, not a key of yours.',
          parrafos: [
            'The verification GET echoes `hub.challenge` if `hub.verify_token` matches the app’s. The POST carries Meta’s HMAC signature in the header; if it does not match, it is dropped. We handle that with the app secret. When you connect the channel there is no webhook token to paste into a panel.',
            'If the payload id belongs to no business —a `phone_number_id`, a PAGE_ID, or an IGID nobody connected— the event is thrown away. The recipient is not guessed.',
          ],
        },
        {
          titulo: 'The three objects.',
          parrafos: [
            'WhatsApp arrives with `object: whatsapp_business_account` and `entry[].changes[]`. The business comes from `value.metadata.phone_number_id`. Text is in `messages[]` when `type` is `text`; any other type is ignored and logged. Receipts come in `statuses[]` (sent, delivered, read, failed) and name the outbound wamid.',
            'Instagram and Messenger arrive with `entry[].messaging[]`. The `instagram` object resolves by IGID (`entry[].id`); the `page` object, by PAGE_ID. A `message.is_echo` is dropped. The contact id is stored with a prefix (`ig:…`, `fb:…`) so it does not collide with a `wa_id` of the same shape. On these two channels the receipt is a watermark: everything before that mark is delivered or read, without listing messages.',
          ],
        },
        {
          titulo: 'Statuses, dedup, and what does not come in.',
          parrafos: [
            'The CRM answers 200 and processes afterwards, so Meta does not retry on time. The message id is inserted into an events table; if it was already there, the pipeline does not run again. A receipt that arrives out of order cannot lower the status: delivered does not overwrite read.',
            'Inbound attachments, comments, mentions, and non-text messages are not processed. There is no outbound webhook into your database, and no schema for Make or Zapier. What stays in Conext is the thread, the bubble status, and, if it applies, the AI draft.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Connect the channel in the CRM', texto: 'That is where the ids are stored. Without them Meta’s webhook has no one to attribute the event to.' },
        { titulo: 'Meta POSTs to our URL', texto: 'The signature is checked. The business is resolved. 200 is returned.' },
        { titulo: 'The pipeline runs or it is dropped', texto: 'New text: classify and draft. Receipt: update the bubble. Echo, attachment, or unknown id: it does not enter the inbox.' },
      ],
      cierre:
        'This reference describes the path from Meta into Conext. It is not an API for another system to write to us, and not a connector going out.',
    }),
  },
}
