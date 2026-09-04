function pagina({ nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }) {
  return { nombre, menu, title, description, titulo, bajada, intro, secciones, pasos, cierre }
}

export const integracionesEs = {
  verTambien: 'Otras integraciones',
  enLaPractica: 'En la práctica',
  ctaTitulo: '¿Querés verlo con tus conversaciones?',
  ctaTexto: 'Una demo corta, con el catálogo y las preguntas que ya te llegan por WhatsApp.',
  ctaBoton: 'Pedir una demo',
  indice: {
    nombre: 'Integraciones',
    etiqueta: 'Integraciones',
    title: 'Integraciones | Conext',
    description:
      'Cómo se conecta Conext a la API oficial de WhatsApp Business, a Instagram Direct y a los webhooks de Meta. El número es tuyo; los eventos llegan al CRM.',
    titulo: 'Los canales oficiales, sin un servidor de más.',
    bajada:
      'WhatsApp, Instagram y Messenger entran por la puerta que abre Meta. No hay que clonar una sesión ni levantar un webhook propio.',
    intro:
      'Conext es una sola app de Meta. Cuando conectás el número o la Página desde Configuración, los eventos llegan a nuestra URL. El CRM resuelve a qué negocio pertenecen y los guarda en esa bandeja.',
  },
  paginas: {
    whatsapp: pagina({
      nombre: 'WhatsApp Business API',
      menu: 'La Cloud API, tu número',
      title: 'WhatsApp Business API | Conext',
      description:
        'Conectá tu línea de WhatsApp Business a Conext por la Cloud API de Meta. Varias personas y agentes en el mismo número, sin riesgo de baneo por clientes no oficiales.',
      titulo: 'El número oficial, con el equipo encima.',
      bajada:
        'La Cloud API es la vía que Meta abre para un CRM. El número es tuyo. El teléfono del local deja de ser el que se presta.',
      intro:
        'Conext no se cuelga de WhatsApp Web ni de la app del teléfono. Enlaza el WhatsApp Business con tu cuenta de Meta. Si un día te vas, te llevás el número.',
      secciones: [
        {
          titulo: 'Por qué la vía oficial.',
          parrafos: [
            'Las herramientas que clonan la sesión o leen la app del teléfono funcionan hasta que Meta las detecta. Un número baneado no se discute con el CRM: se perdió. La Cloud API es la puerta que Meta habilita para automatizar, con un token de la cuenta del negocio y un webhook que ellos firman.',
            'Un número conectado a la API no puede estar al mismo tiempo en la app de WhatsApp del teléfono. Si hoy lo atendés a mano y no querés cortar eso todavía, se empieza con un número aparte y se pasa el principal cuando te sientas cómodo.',
          ],
        },
        {
          titulo: 'Varias personas, un número.',
          parrafos: [
            'El equipo entra cada uno con su usuario. Los agentes de IA atienden en el mismo hilo. Nadie pide prestado el celular de la caja. La carpeta “Mías” y la de “Sin asignar” salen de quién tiene cada conversación, no de quién tiene el aparato.',
            'Meta cobra las conversaciones directo a tu cuenta, con su tarifa. conext no le agrega un margen. Lo que se paga acá es el software: la bandeja, los agentes, el catálogo.',
          ],
        },
        {
          titulo: 'Qué entra y qué todavía no.',
          parrafos: [
            'Hoy se procesan los mensajes de texto. Los acuses de enviado, entregado, leído y fallido actualizan el globo. Los adjuntos que mandás vos se suben a Graph y quedan copiados en el CRM, porque Meta borra los suyos a los 30 días. Los que manda el cliente todavía no se bajan: el hilo muestra el texto; una foto que te mandan no abre todavía.',
            'Pasadas las 24 horas desde el último mensaje del cliente, Meta rechaza el texto libre. Ahí salen las plantillas aprobadas de tu WABA. Viven en Meta, no en una copia nuestra: el estado de aprobación se pregunta a Graph, no se adivina.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Abrís Canales', texto: 'En Configuración está la ficha de WhatsApp. El alta embebida de Meta enlaza el número a tu cuenta, no a la nuestra.' },
        { titulo: 'El CRM se suscribe', texto: 'Quedan el token (cifrado) y el phone_number_id. A partir de ahí los eventos de ese número llegan a Conext.' },
        { titulo: 'Escribís de prueba', texto: 'Un “hola” al número conectado tiene que aparecer en la bandeja. Si no aparece, el alta de Meta no terminó o la app no está suscrita al webhook.' },
      ],
      cierre:
        'La API no es un sello. Es la diferencia entre un CRM que Meta deja correr y una sesión clonada que un día deja de existir.',
    }),
    instagram: pagina({
      nombre: 'Instagram Direct',
      menu: 'DMs en la misma bandeja',
      title: 'Instagram Direct | Conext',
      description:
        'Los mensajes directos de Instagram entran a la misma bandeja que WhatsApp. Se conectan por la Página de Facebook del negocio, con el mismo token que Messenger.',
      titulo: 'El DM de Instagram, al lado del WhatsApp.',
      bajada:
        'Una sola Página conecta Instagram y Messenger. El cliente escribe por donde le queda a mano; el hilo en Conext es uno.',
      intro:
        'La cuenta profesional de Instagram cuelga de la Página. Meta emite un token con permiso sobre las dos caras. Por eso en Configuración hay una ficha “Instagram y Messenger”, no dos botones.',
      secciones: [
        {
          titulo: 'Direct, no el comentario ni la historia.',
          parrafos: [
            'Conext procesa el mensaje de texto del chat. Un comentario en la publicación o una mención en una historia no abren un hilo: el webhook de esos eventos no se atiende todavía. Si el trabajo es convertir un comentario en un embudo, esa no es esta integración.',
            'El DM sí. Llega con el identificador de Instagram (IGSID), que el CRM guarda prefijado para no mezclarlo con un número de WhatsApp del mismo largo. En la bandeja se ve el distintivo del canal: contestar por el lado equivocado no se deshace.',
          ],
        },
        {
          titulo: 'Messenger viaja en el mismo token.',
          parrafos: [
            'Instagram y Messenger son la Messenger Platform: el mismo formato de webhook, el mismo envío, la misma ventana de 24 horas. Lo que los separa es el `object` del payload —`instagram` o `page`— y de dónde salió el id del contacto. Una Página sin Instagram atado deja Messenger andando igual; la conexión avisa, no falla.',
            'El nombre del contacto no viene en el mensaje. El CRM lo pregunta a Graph. Si el permiso de perfil no está aprobado, el hilo se titula con el id: preferible eso a un mensaje que no se guarda.',
          ],
        },
        {
          titulo: 'Qué pide Meta de tu lado.',
          parrafos: [
            'Hasta que pase el App Review de `instagram_manage_messages` y `pages_messaging`, esto funciona con cuentas que tengan un rol en la app: alcanza para desarrollo y para la demo. En la consola de Meta hay que suscribir la app al webhook `messages` de Messenger e Instagram. Sin eso la ficha dice conectado y no llega ni un mensaje.',
            'Los adjuntos salientes por Instagram todavía no salen: Instagram quiere una URL pública del archivo, y los nuestros se sirven detrás de la sesión. Falta esa URL firmada. El texto del DM sí va y vuelve.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Conectás la Página', texto: 'Desde Configuración, la ficha de Instagram y Messenger. El alta embebida de Facebook tiene que terminar adentro de Conext, no en otra pestaña.' },
        { titulo: 'Se guarda el token de Página', texto: 'Cifrado, igual que el de WhatsApp. Con él salen los DMs de Instagram y los de Messenger.' },
        { titulo: 'Mandás un Direct de prueba', texto: 'Tiene que aparecer en la bandeja con la marca de Instagram. Si no aparece, falta la suscripción al webhook `messages` en la consola.' },
      ],
      cierre:
        'Instagram en Conext es el chat. El comentario y la historia, todavía no. El DM del cliente que ya preguntó el precio, sí.',
    }),
    webhooks: pagina({
      nombre: 'Webhooks de Meta',
      menu: 'Los eventos llegan solos',
      title: 'Webhooks de Meta | Conext',
      description:
        'Al conectar WhatsApp o la Página, Meta manda los eventos a Conext. No tenés que levantar un servidor ni una URL propia: una sola app, y el CRM resuelve a qué negocio pertenece cada mensaje.',
      titulo: 'Los eventos de Meta, sin un servidor tuyo.',
      bajada:
        'No hay un webhook para pegar en Make ni una URL que tengas que hospedar. Conectás el canal en Configuración y los mensajes empiezan a entrar.',
      intro:
        'Todos los clientes de Conext comparten la misma suscripción de la app de Meta. Lo que dice de quién es cada evento es el id que Meta pone en el payload: el número, la Página o la cuenta de Instagram.',
      secciones: [
        {
          titulo: 'No es un webhook hacia tu base.',
          parrafos: [
            'Conext no dispara eventos hacia un ERP, una planilla ni Zapier. Lo que hay es el camino inverso: Meta nos avisa, nosotros guardamos el hilo y la IA redacta. Si hace falta sincronizar contactos con otro sistema, hoy no hay un conector. La bandeja es el sistema.',
            'La URL la hospedamos nosotros. El desafío de verificación (`hub.challenge`) y la firma de cada POST los resolvemos con el secreto de la app. De tu lado no hay un token de webhook que copiar: hay un botón de conectar en Canales.',
          ],
        },
        {
          titulo: 'Cómo se sabe de qué negocio es.',
          parrafos: [
            'WhatsApp trae el `phone_number_id` en el payload. Instagram y Messenger traen el `entry[].id`, que es el IGID o el PAGE_ID según el `object`. Esas tres columnas son únicas: dos negocios no pueden reclamar el mismo número. Si el id no matchea a nadie, el evento se descarta. Adivinar sería escribirlo en la bandeja equivocada.',
            'El CRM responde 200 de inmediato y procesa después. Si tardara, Meta reintenta y el mismo mensaje se duplicaría. El identificador del mensaje (el wamid, o el mid de Messenger) hace de candado: la segunda entrega no crea otra fila.',
          ],
        },
        {
          titulo: 'Qué se procesa hoy.',
          parrafos: [
            'Texto. Un audio, una foto o una ubicación se registran en el log y no abren respuesta: el cliente quedaría esperando algo que el equipo no ve. Los acuses sí: en WhatsApp, cada estado nombra el mensaje; en Messenger e Instagram llega una marca de agua (“todo lo anterior está entregado”) y se actualizan las salientes de ese hilo.',
            'Si la app está suscrita a `message_echoes`, Meta nos devuelve nuestro propio envío. Ese eco se descarta: si no, la IA se contestaría a sí misma. El detalle de los objetos y los estados está en la referencia de la documentación.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Conectás el canal', texto: 'WhatsApp o la Página, desde Configuración. Ahí se guardan los ids con los que se va a resolver cada evento.' },
        { titulo: 'Meta manda a nuestra URL', texto: 'No hay nada que pegar en un panel de “webhook saliente”. La suscripción es de la app de Conext.' },
        { titulo: 'El hilo aparece en la bandeja', texto: 'Si no aparece, el id de Meta no está atado a tu negocio o la app no está suscrita a `messages`.' },
      ],
      cierre:
        'El webhook es de Meta hacia Conext, no de Conext hacia el resto de tus herramientas. Por eso conectar el canal alcanza, y por eso no hay una ficha de Zapier.',
    }),
  },
}

export const integracionesEn = {
  verTambien: 'Other integrations',
  enLaPractica: 'In practice',
  ctaTitulo: 'Want to see it with your own threads?',
  ctaTexto: 'A short demo, with the catalog and the questions you already get on WhatsApp.',
  ctaBoton: 'Request a demo',
  indice: {
    nombre: 'Integrations',
    etiqueta: 'Integrations',
    title: 'Integrations | Conext',
    description:
      'How Conext connects to the official WhatsApp Business API, Instagram Direct, and Meta webhooks. The number is yours; events arrive at the CRM.',
    titulo: 'Official channels, without an extra server.',
    bajada:
      'WhatsApp, Instagram, and Messenger come in through the door Meta opens. There is no cloning a session or hosting your own webhook.',
    intro:
      'Conext is a single Meta app. When you connect the number or the Page from Settings, events arrive at our URL. The CRM resolves which business they belong to and stores them in that inbox.',
  },
  paginas: {
    whatsapp: pagina({
      nombre: 'WhatsApp Business API',
      menu: 'Cloud API, your number',
      title: 'WhatsApp Business API | Conext',
      description:
        'Connect your WhatsApp Business line to Conext through Meta’s Cloud API. Several people and agents on the same number, without the ban risk of unofficial clients.',
      titulo: 'The official number, with the team on it.',
      bajada:
        'Cloud API is the path Meta opens for a CRM. The number is yours. The shop phone stops being the one people borrow.',
      intro:
        'Conext does not hang off WhatsApp Web or the phone app. It links WhatsApp Business to your Meta account. If you leave one day, you take the number with you.',
      secciones: [
        {
          titulo: 'Why the official path.',
          parrafos: [
            'Tools that clone the session or read the phone app work until Meta detects them. A banned number is not an argument with the CRM: it is gone. Cloud API is the door Meta opens for automation, with a token from the business account and a webhook they sign.',
            'A number on the API cannot be on the WhatsApp phone app at the same time. If you still answer by hand and do not want to cut that yet, start with a separate number and move the main one when you are ready.',
          ],
        },
        {
          titulo: 'Several people, one number.',
          parrafos: [
            'The team signs in each with their own user. AI agents attend in the same thread. Nobody borrows the till phone. The “Mine” and “Unassigned” folders come from who owns each conversation, not from who holds the device.',
            'Meta bills conversations straight to your account at their rate. conext does not add a margin. What you pay here is the software: the inbox, the agents, the catalog.',
          ],
        },
        {
          titulo: 'What comes in, and what does not yet.',
          parrafos: [
            'Text messages are processed today. Sent, delivered, read, and failed receipts update the bubble. Outbound attachments are uploaded to Graph and copied in the CRM, because Meta deletes theirs after 30 days. Inbound ones are not downloaded yet: the thread shows the text; a photo they send does not open yet.',
            'Past 24 hours from the customer’s last message, Meta rejects free text. That is when approved templates from your WABA go out. They live in Meta, not in a copy of ours: approval status is asked of Graph, not guessed.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Open Channels', texto: 'Settings has the WhatsApp card. Meta’s embedded signup links the number to your account, not ours.' },
        { titulo: 'The CRM subscribes', texto: 'The token (encrypted) and the phone_number_id are stored. From then on, events for that number arrive at Conext.' },
        { titulo: 'Send a test', texto: 'A “hello” to the connected number should show up in the inbox. If it does not, Meta’s signup did not finish or the app is not subscribed to the webhook.' },
      ],
      cierre:
        'The API is not a badge. It is the difference between a CRM Meta lets run and a cloned session that one day stops existing.',
    }),
    instagram: pagina({
      nombre: 'Instagram Direct',
      menu: 'DMs in the same inbox',
      title: 'Instagram Direct | Conext',
      description:
        'Instagram direct messages land in the same inbox as WhatsApp. They connect through the business Facebook Page, with the same token as Messenger.',
      titulo: 'The Instagram DM, next to WhatsApp.',
      bajada:
        'A single Page connects Instagram and Messenger. The customer writes wherever is handy; the thread in Conext is one.',
      intro:
        'The professional Instagram account hangs off the Page. Meta issues a token with permission over both faces. That is why Settings has one “Instagram and Messenger” card, not two buttons.',
      secciones: [
        {
          titulo: 'Direct, not the comment or the story.',
          parrafos: [
            'Conext processes the chat’s text message. A comment on a post or a mention in a story does not open a thread: those webhook events are not handled yet. If the job is turning a comment into a funnel, that is not this integration.',
            'The DM is. It arrives with the Instagram identifier (IGSID), which the CRM stores with a prefix so it is not mixed with a WhatsApp number of the same length. The inbox shows the channel mark: answering on the wrong side cannot be undone.',
          ],
        },
        {
          titulo: 'Messenger rides on the same token.',
          parrafos: [
            'Instagram and Messenger are the Messenger Platform: the same webhook shape, the same send path, the same 24-hour window. What separates them is the payload `object` —`instagram` or `page`— and where the contact id came from. A Page with no Instagram attached still runs Messenger; the connection warns, it does not fail.',
            'The contact’s name does not come with the message. The CRM asks Graph. If the profile permission is not approved, the thread is titled with the id: better that than a message that is not stored.',
          ],
        },
        {
          titulo: 'What Meta asks of you.',
          parrafos: [
            'Until the App Review for `instagram_manage_messages` and `pages_messaging` goes through, this works with accounts that have a role on the app: enough for development and for the demo. In Meta’s console the app has to be subscribed to the `messages` webhook for Messenger and Instagram. Without that the card says connected and not a single message arrives.',
            'Outbound attachments over Instagram do not go out yet: Instagram wants a public URL for the file, and ours are served behind the session. That signed URL is still missing. DM text does go both ways.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Connect the Page', texto: 'From Settings, the Instagram and Messenger card. Facebook’s embedded signup has to finish inside Conext, not in another tab.' },
        { titulo: 'The Page token is stored', texto: 'Encrypted, same as WhatsApp’s. Instagram DMs and Messenger DMs both go out with it.' },
        { titulo: 'Send a test Direct', texto: 'It should appear in the inbox with the Instagram mark. If it does not, the `messages` webhook subscription is missing in the console.' },
      ],
      cierre:
        'Instagram in Conext is the chat. The comment and the story, not yet. The DM from the customer who already asked the price, yes.',
    }),
    webhooks: pagina({
      nombre: 'Meta webhooks',
      menu: 'Events arrive on their own',
      title: 'Meta webhooks | Conext',
      description:
        'When you connect WhatsApp or the Page, Meta sends events to Conext. You do not host a server or your own URL: one app, and the CRM resolves which business each message belongs to.',
      titulo: 'Meta’s events, without a server of yours.',
      bajada:
        'There is no webhook to paste into Make and no URL you have to host. You connect the channel in Settings and messages start coming in.',
      intro:
        'Every Conext customer shares the same Meta app subscription. What says who each event belongs to is the id Meta puts in the payload: the number, the Page, or the Instagram account.',
      secciones: [
        {
          titulo: 'It is not a webhook into your database.',
          parrafos: [
            'Conext does not fire events toward an ERP, a spreadsheet, or Zapier. What exists is the other way: Meta tells us, we store the thread, and the AI drafts. If you need to sync contacts with another system, there is no connector today. The inbox is the system.',
            'We host the URL. The verification challenge (`hub.challenge`) and the signature on every POST are handled with the app secret. On your side there is no webhook token to copy: there is a connect button in Channels.',
          ],
        },
        {
          titulo: 'How it knows which business it is.',
          parrafos: [
            'WhatsApp brings the `phone_number_id` in the payload. Instagram and Messenger bring `entry[].id`, which is the IGID or the PAGE_ID depending on the `object`. Those three columns are unique: two businesses cannot claim the same number. If the id matches no one, the event is dropped. Guessing would write it in the wrong inbox.',
            'The CRM answers 200 immediately and processes afterwards. If it were slow, Meta would retry and the same message would duplicate. The message id (the wamid, or Messenger’s mid) is the lock: the second delivery does not create another row.',
          ],
        },
        {
          titulo: 'What is processed today.',
          parrafos: [
            'Text. An audio, a photo, or a location is logged and does not open a reply: the customer would be waiting for something the team cannot see. Receipts do: on WhatsApp each status names the message; on Messenger and Instagram a watermark arrives (“everything before this is delivered”) and that thread’s outbound messages are updated.',
            'If the app is subscribed to `message_echoes`, Meta sends our own outbound back. That echo is dropped: otherwise the AI would answer itself. The objects and statuses are in the documentation reference.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Connect the channel', texto: 'WhatsApp or the Page, from Settings. That is where the ids used to resolve each event are stored.' },
        { titulo: 'Meta posts to our URL', texto: 'There is nothing to paste into an “outbound webhook” panel. The subscription belongs to Conext’s app.' },
        { titulo: 'The thread shows up in the inbox', texto: 'If it does not, Meta’s id is not tied to your business or the app is not subscribed to `messages`.' },
      ],
      cierre:
        'The webhook is from Meta into Conext, not from Conext out to the rest of your tools. That is why connecting the channel is enough, and why there is no Zapier card.',
    }),
  },
}
