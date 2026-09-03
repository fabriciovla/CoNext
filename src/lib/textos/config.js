// Los textos de Configuración y de las dos tarjetas de conexión.
// Ver `textos/index.js`.

const CONFIG = {
  titulo: { es: 'Configuración', en: 'Settings' },
  bajada: {
    es: 'El canal por el que entran los mensajes, el horario del negocio y cómo responde la IA.',
    en: 'The channel messages come in through, your business hours, and how the AI replies.',
  },
  secciones: { es: 'Secciones de configuración', en: 'Settings sections' },
  seccionGeneral: { es: 'General', en: 'General' },
  seccionCanales: { es: 'Canales', en: 'Channels' },
  seccionHorario: { es: 'Horario', en: 'Hours' },
  seccionRespuestas: { es: 'Respuestas automáticas', en: 'Automated replies' },
  seccionApariencia: { es: 'Apariencia', en: 'Appearance' },

  nombreNegocio: { es: 'Nombre del negocio', en: 'Business name' },
  nombreNegocioDesc: {
    es: 'Cómo se llama tu negocio adentro de conext. Se ve arriba de la barra de la izquierda y es lo que distingue una cuenta de otra.',
    en: 'What your business is called inside conext. It shows at the top of the left sidebar and is what tells one account from another.',
  },
  nombreNegocioHint: { es: 'Máximo 40 caracteres.', en: '40 characters max.' },
  nombreNegocioPlaceholder: { es: 'Mi negocio', en: 'My business' },

  zonaHoraria: { es: 'Zona horaria', en: 'Time zone' },
  zonaHorariaDesc: {
    es: 'Con esta zona se mide todo lo que depende de la hora: si el negocio está abierto, cuándo sale el aviso de ausencia y cuándo la IA puede responder sola. No es la hora de esta computadora ni la del servidor.',
    en: "Everything time-dependent is measured in this zone: whether the business is open, when the away notice goes out, and when the AI may reply on its own. It's not this computer's clock, nor the server's.",
  },
  zonaHorariaAhi: { es: 'Ahí son las {hora}.', en: "It's {hora} there." },
  zonaHorariaCambio: {
    es: 'Con este cambio, el horario de atención pasa a medirse a las {hora}.',
    en: 'With this change, business hours will be measured at {hora}.',
  },
  zonaHorariaAria: { es: 'Zona horaria del negocio', en: 'Business time zone' },

  numeroWhatsapp: { es: 'Número de WhatsApp', en: 'WhatsApp number' },
  numeroWhatsappDesc: {
    es: 'El número por el que entran y salen los mensajes. Lo define la conexión con Meta, así que acá se mira pero no se escribe.',
    en: 'The number messages come in and go out through. The Meta connection defines it, so here you can read it but not type it.',
  },
  numeroWhatsappHint: {
    es: 'Para cambiarlo hay que conectar otro número desde Canales.',
    en: 'To change it, connect another number from Channels.',
  },
  numeroWhatsappSinHint: {
    es: 'Sin número conectado, la IA redacta las respuestas pero no puede enviarlas.',
    en: "With no number connected, the AI drafts replies but can't send them.",
  },
  irACanales: { es: 'Ir a Canales', en: 'Go to Channels' },
  sinNumero: { es: 'Todavía no hay ningún número conectado.', en: 'No number is connected yet.' },
  copiarNumero: { es: 'Copiar el número de WhatsApp', en: 'Copy the WhatsApp number' },

  horarioTitulo: { es: 'Horario de atención', en: 'Business hours' },
  horarioDesc: {
    es: 'Los días y las horas en las que la IA puede responder sola. Fuera de esa franja se manda el aviso de ausencia y las respuestas quedan como borrador.',
    en: 'The days and hours when the AI may reply on its own. Outside that window the away notice goes out and replies stay as drafts.',
  },
  horarioHint: {
    es: ({ n }) =>
      `${n} día${n === 1 ? '' : 's'} configurado${n === 1 ? '' : 's'}. Los cambios del horario se guardan al tocarlos.`,
    en: ({ n }) =>
      `${n} day${n === 1 ? '' : 's'} configured. Schedule changes are saved as you tap them.`,
  },
  horarioSinDias: {
    es: 'Activá al menos un día para que la IA sepa cuándo puede responder automáticamente.',
    en: 'Turn on at least one day so the AI knows when it can reply automatically.',
  },
  sinHorario: { es: 'Sin horario', en: 'No hours set' },
  cerrar: { es: 'Cerrar', en: 'Close' },
  cerradoDia: { es: 'Cerrado', en: 'Closed' },
  horaApertura: { es: 'Hora de apertura del {dia}', en: 'Opening time on {dia}' },
  horaCierre: { es: 'Hora de cierre del {dia}', en: 'Closing time on {dia}' },
  a: { es: 'a', en: 'to' },

  tonoCasa: { es: 'Tono de la casa', en: 'House tone' },
  tonoCasaDesc: {
    es: 'El ejemplo con el que la IA aprende cómo habla tu negocio: el saludo, el trato, si se usan emojis. No se envía como mensaje.',
    en: "The example the AI learns your business's voice from: the greeting, how you address people, whether you use emojis. It is never sent as a message.",
  },
  tonoCasaHint: {
    es: 'Sirve de modelo para todas las respuestas; no reemplaza a las instrucciones del agente.',
    en: "It's a model for every reply; it doesn't replace the agent's instructions.",
  },
  tonoCasaPlaceholder: {
    es: '¡Hola! Gracias por escribirnos 😊 ¿En qué te podemos ayudar?',
    en: 'Hi! Thanks for writing 😊 How can we help?',
  },

  fueraDeHorario: { es: 'Mensaje fuera de horario', en: 'After-hours message' },
  fueraDeHorarioDesc: {
    es: 'Lo que recibe quien escribe con el negocio cerrado, para que no se quede esperando una respuesta que no va a llegar hasta mañana.',
    en: "What someone gets when they write while you're closed, so they don't sit waiting for a reply that won't come until tomorrow.",
  },
  fueraDeHorarioHint: {
    es: 'Se envía como máximo una vez cada 12 h. Vacío, no se manda ningún aviso.',
    en: 'Sent at most once every 12 h. Left empty, no notice goes out.',
  },
  fueraDeHorarioPlaceholder: {
    es: 'Ahora no estamos atendiendo. Te respondemos apenas abrimos.',
    en: "We're closed right now. We'll get back to you as soon as we open.",
  },

  // El idioma en el que la IA le escribe al cliente. Va en Respuestas
  // automáticas y no en Apariencia: no es una preferencia de quien mira la
  // pantalla —esa es el idioma de la dashboard— sino lo que reciben los
  // clientes del negocio, así que se guarda en la base y lo ven todos.
  idiomaIA: { es: 'Idioma de las respuestas', en: 'Reply language' },
  idiomaIADesc: {
    es: 'En qué idioma le escribe la IA al cliente por WhatsApp, Instagram y Messenger. No cambia el idioma de esta pantalla, que se elige en Apariencia.',
    en: "The language the AI writes to customers in on WhatsApp, Instagram and Messenger. It doesn't change this screen's language, which you pick under Appearance.",
  },
  idiomaIAHint: {
    es: 'Se aplica a los mensajes que se redacten a partir de ahora; los ya enviados quedan como están.',
    en: 'Applies to messages drafted from now on; the ones already sent stay as they are.',
  },
  idiomaIAAria: { es: 'Idioma de las respuestas de la IA', en: 'AI reply language' },
  idiomaIAAuto: { es: 'El del cliente', en: "The customer's" },
  idiomaIAAutoHint: {
    es: 'contesta en el idioma en que le escriben',
    en: 'replies in whatever language it is written to',
  },
  idiomaIAEspanol: { es: 'Español', en: 'Spanish' },
  idiomaIAIngles: { es: 'Inglés', en: 'English' },
  idiomaIAPortugues: { es: 'Portugués', en: 'Portuguese' },

  tema: { es: 'Tema', en: 'Theme' },
  temaDesc: {
    es: 'Claro u oscuro. Es una preferencia de este equipo: se guarda en el navegador y no la ven los demás miembros del negocio.',
    en: "Light or dark. It's a preference for this device: saved in the browser, and nobody else on the team sees it.",
  },
  temaHint: { es: 'El cambio se aplica al instante.', en: 'The change applies instantly.' },
  temaClaro: { es: 'Claro', en: 'Light' },
  temaOscuro: { es: 'Oscuro', en: 'Dark' },

  // El idioma de la dashboard va al lado del tema porque es la misma clase de
  // cosa: una preferencia de este equipo, guardada en el navegador.
  idioma: { es: 'Idioma', en: 'Language' },
  idiomaDesc: {
    es: 'En qué idioma se ve esta dashboard. Es una preferencia de este equipo: se guarda en el navegador y no la ven los demás miembros del negocio. No cambia el idioma en el que la IA le contesta a tus clientes, que se elige en Respuestas automáticas.',
    en: "What language this dashboard is in. It's a preference for this device: saved in the browser, and nobody else on the team sees it. It doesn't change the language the AI replies to your customers in — that's under Automated replies.",
  },
  idiomaHint: { es: 'El cambio se aplica al instante.', en: 'The change applies instantly.' },
  idiomaAria: { es: 'Idioma de la dashboard', en: 'Dashboard language' },
}

const CANALES = {
  consultandoEstado: {
    es: 'Consultando el estado de la conexión',
    en: 'Checking the connection status',
  },
  noSePudoConsultar: {
    es: 'No se pudo consultar el estado de la conexión.',
    en: "Couldn't check the connection status.",
  },
  sinConfigurar: { es: 'Sin configurar', en: 'Not set up' },
  cargaAntes: { es: 'Cargá ', en: 'Add ' },
  cargaEn: { es: ' en ', en: ' to ' },
  datosConexion: { es: 'Datos de la conexión', en: 'Connection details' },
  conectando: { es: 'Conectando…', en: 'Connecting…' },
  ventanaDeMeta: {
    es: 'Se abre una ventana de Meta: tu contraseña no pasa por acá.',
    en: 'A Meta window opens: your password never goes through here.',
  },

  whatsappBajada: {
    es: 'Los mensajes del número de WhatsApp Business del negocio, en la bandeja del CRM.',
    en: "Messages from the business's WhatsApp Business number, in the CRM inbox.",
  },
  tokenVencido: { es: 'Token vencido', en: 'Token expired' },
  tokenVencidoAviso: {
    es: 'El token venció. Volvé a conectar el número para retomar los mensajes.',
    en: 'The token expired. Reconnect the number to start receiving messages again.',
  },
  conectarOtroNumero: { es: 'Conectar otro número', en: 'Connect another number' },
  datoNombre: { es: 'Nombre', en: 'Name' },
  datoCalidad: { es: 'Calidad', en: 'Quality' },

  metaBajada: {
    es: 'Los directos de Instagram y los mensajes de Messenger, en la misma bandeja: cuelgan de la misma Página y se conectan juntos.',
    en: 'Instagram DMs and Messenger messages in the same inbox: they hang off the same Page and connect together.',
  },
  variasPaginas: {
    es: 'Administrás varias Páginas. Elegí cuál querés atender desde el CRM.',
    en: 'You manage several Pages. Pick the one you want to handle from the CRM.',
  },
  sinInstagramAsociado: { es: 'Sin Instagram asociado', en: 'No Instagram linked' },
  sinAcceso: { es: 'Sin acceso', en: 'No access' },
  sinAccesoAviso: {
    es: 'Se revocó el acceso. Volvé a conectar la Página para retomar los mensajes.',
    en: 'Access was revoked. Reconnect the Page to start receiving messages again.',
  },
  conectarOtraPagina: { es: 'Conectar otra Página', en: 'Connect another Page' },
  paginaNumero: { es: 'Página {id}', en: 'Page {id}' },
  sinCuentaAsociada: { es: 'Sin cuenta asociada', en: 'No account linked' },
  paginaDeFacebook: { es: 'Página de Facebook', en: 'Facebook Page' },
  instagramTitle: {
    es: 'Contestar desde el CRM los mensajes directos de Instagram',
    en: 'Reply to Instagram direct messages from the CRM',
  },
  messengerTitle: {
    es: 'Contestar desde el CRM los mensajes de la Página',
    en: "Reply to the Page's messages from the CRM",
  },
  apagarNoDesconecta: {
    es: 'Apagarlo no desconecta el canal: el CRM deja de atenderlo.',
    en: "Turning it off doesn't disconnect the channel: the CRM just stops handling it.",
  },

  // Los avisos y errores del alta embebida de Meta. Los manda el hook como
  // clave y los arma la tarjeta, que es la única que los muestra.
  codigoCorto: {
    es: 'El código de Meta vence a los 30 segundos. Probá de nuevo.',
    en: "Meta's code expires after 30 seconds. Try again.",
  },
  cancelaste: {
    es: 'Cancelaste la conexión antes de terminar.',
    en: 'You cancelled the connection before finishing.',
  },
  metaRechazo: { es: 'Meta rechazó la conexión.', en: 'Meta rejected the connection.' },
  sinNumeroElegido: {
    es: 'Meta no devolvió el número elegido. Cerrá el popup y probá de nuevo.',
    en: "Meta didn't return the chosen number. Close the popup and try again.",
  },
  sdkNoListo: {
    es: 'El conector de Meta todavía no está listo.',
    en: "Meta's connector isn't ready yet.",
  },
  noSeCompleto: { es: 'No se completó la conexión.', en: 'The connection was not completed.' },
  sinPermisos: {
    es: 'No diste los permisos que la app necesita.',
    en: "You didn't grant the permissions the app needs.",
  },
  sinPermisosOCerrada: {
    es: 'No se completó la conexión: cerraste la ventana o no diste los permisos.',
    en: "The connection wasn't completed: you closed the window or didn't grant the permissions.",
  },
  sinPaginas: {
    es: 'Tu cuenta no administra ninguna Página de Facebook.',
    en: 'Your account does not manage any Facebook Page.',
  },
}

export default { config: CONFIG, canales: CANALES }
