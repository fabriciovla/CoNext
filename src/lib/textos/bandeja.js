// Los textos de la bandeja: la lista de conversaciones, el hilo, el cuadro de
// respuesta y la ficha de contacto. Ver `textos/index.js`.

const BANDEJA = {
  diaArchivado: { es: 'Día archivado', en: 'Archived day' },
  volverAHoy: { es: 'Volver a hoy', en: 'Back to today' },
  soloLectura: {
    es: 'Estás viendo un día archivado, es de solo lectura.',
    en: "You're viewing an archived day — it's read-only.",
  },
  diaCerrado: {
    es: 'El día está cerrado. Abrí un nuevo día para responder.',
    en: 'The day is closed. Open a new day to reply.',
  },

  // La columna de la izquierda.
  tabChats: { es: 'Chats', en: 'Chats' },
  tabLlamadas: { es: 'Llamadas', en: 'Calls' },
  nuevaConversacion: { es: 'Nueva conversación', en: 'New conversation' },
  buscarPlaceholder: {
    es: 'Buscar contacto o mensaje...',
    en: 'Search contacts or messages...',
  },
  ordenar: { es: 'Ordenar conversaciones', en: 'Sort conversations' },
  ordenRecientes: { es: 'Abiertas, recientes', en: 'Open, newest first' },
  ordenAntiguas: { es: 'Abiertas, antiguas', en: 'Open, oldest first' },
  ordenPendientes: { es: 'Pendientes primero', en: 'Pending first' },
  sinResponder: { es: 'Sin responder', en: 'Unanswered' },
  sinResponderTitle: {
    es: 'Mostrar solo las que esperan respuesta',
    en: 'Show only those waiting for a reply',
  },
  sinLlamadas: {
    es: 'Todavía no registramos llamadas.',
    en: "We don't record calls yet.",
  },
  sinLlamadasPie: {
    es: 'Las conversaciones están en la pestaña Chats.',
    en: 'Conversations live in the Chats tab.',
  },
  listaVacia: {
    es: 'No hay conversaciones en esta vista.',
    en: 'No conversations in this view.',
  },
  tieneNotas: { es: 'Tiene notas internas', en: 'Has internal notes' },
  ultimaDeAgente: {
    es: 'La última respuesta la mandó un agente',
    en: 'An agent sent the last reply',
  },
  responsableTitle: { es: 'Responsable: {nombre}', en: 'Assigned to: {nombre}' },

  // El hilo.
  elegiConversacion: {
    es: 'Elegí una conversación de la lista',
    en: 'Pick a conversation from the list',
  },
  elegiConversacionPie: {
    es: 'para ver el historial completo.',
    en: 'to see the full history.',
  },
  sinCoincidencias: {
    es: 'Ningún mensaje coincide con “{query}”.',
    en: 'No message matches “{query}”.',
  },
  respondio: { es: 'Respondió {nombre}', en: '{nombre} replied' },
  enviando: { es: 'Enviando…', en: 'Sending…' },
  enviandoVarios: { es: 'Enviando {n} mensajes…', en: 'Sending {n} messages…' },
  noSeEntrego: { es: 'No se pudo entregar', en: "Couldn't be delivered" },
  noSeEntregoLargo: { es: 'No se entregó', en: 'Not delivered' },
  entregaSent: { es: 'Enviado', en: 'Sent' },
  entregaDelivered: { es: 'Entregado', en: 'Delivered' },
  entregaRead: { es: 'Leído', en: 'Read' },
  notaInterna: { es: 'Nota interna', en: 'Internal note' },
  notaInternaAviso: {
    es: '· solo la ve el equipo, no se envía',
    en: '· only your team sees it, it is not sent',
  },
  adjuntoRoto: { es: 'No se pudo abrir el adjunto', en: "Couldn't open the attachment" },
  archivo: { es: 'archivo', en: 'file' },

  // El composer.
  sugerenciaDe: { es: 'Sugerencia de {nombre}', en: 'Suggestion from {nombre}' },
  sugerencia: { es: 'Sugerencia:', en: 'Suggestion:' },
  descartar: { es: 'Descartar', en: 'Dismiss' },
  usarYEditar: { es: 'Usar y editar', en: 'Use and edit' },
  ver: { es: 'Ver', en: 'View' },
  escribiMensaje: { es: 'Escribí un mensaje', en: 'Write a message' },
  escribiNota: { es: 'Escribí una nota', en: 'Write a note' },
  mensajeParaCliente: { es: 'Mensaje para el cliente', en: 'Message to the customer' },
  emoji: { es: 'Emoji', en: 'Emoji' },
  adjuntar: { es: 'Adjuntar un archivo', en: 'Attach a file' },
  quitarAdjunto: { es: 'Quitar el adjunto', en: 'Remove attachment' },
  cambiarANota: {
    es: 'Cambiar a nota interna (Ctrl + \\)',
    en: 'Switch to internal note (Ctrl + \\)',
  },
  grabarNota: { es: 'Grabar una nota de voz', en: 'Record a voice note' },
  grabando: { es: 'Grabando', en: 'Recording' },
  descartarGrabacion: { es: 'Descartar la grabación', en: 'Discard recording' },
  terminarGrabacion: { es: 'Terminar la grabación', en: 'Finish recording' },
  guardarNota: { es: 'Guardar nota', en: 'Save note' },
  guardarNotaEnter: { es: 'Guardar nota (Enter)', en: 'Save note (Enter)' },
  enviarMensaje: { es: 'Enviar mensaje', en: 'Send message' },
  enviarMensajeEnter: { es: 'Enviar mensaje (Enter)', en: 'Send message (Enter)' },
  excedido: {
    es: 'El mensaje supera los {max} caracteres',
    en: 'The message is over {max} characters',
  },
  sinMicrofono: {
    es: 'Este navegador no puede grabar audio.',
    en: "This browser can't record audio.",
  },
  microfonoDenegado: {
    es: 'No se pudo usar el micrófono. Revisá el permiso del navegador.',
    en: "Couldn't use the microphone. Check your browser permission.",
  },
  // El nombre del archivo de una nota de voz. Se ve como nombre del adjunto,
  // así que se traduce igual que el resto; sin espacios, que es un nombre de
  // archivo y termina en el disco del server.
  nombreNotaDeVoz: { es: 'nota-de-voz', en: 'voice-note' },

  // La ficha de contacto.
  tabContacto: { es: 'Contacto', en: 'Contact' },
  tabActividad: { es: 'Actividad', en: 'Activity' },
  tabNotas: { es: 'Notas internas', en: 'Internal notes' },
  llamar: { es: 'Llamar', en: 'Call' },
  resolverPendientes: {
    es: ({ n }) => `Resolver ${n} pendiente${n === 1 ? '' : 's'}`,
    en: ({ n }) => `Resolve ${n} pending item${n === 1 ? '' : 's'}`,
  },
  sinPendientes: { es: 'Sin pendientes', en: 'Nothing pending' },
  buscarEnConversacion: {
    es: 'Buscar en la conversación',
    en: 'Search this conversation',
  },
  atendidaPor: { es: 'Atendida por', en: 'Handled by' },
  agenteQueAtiende: {
    es: 'Agente que atiende la conversación',
    en: 'Agent handling this conversation',
  },
  apagado: { es: 'apagado', en: 'off' },
  responsable: { es: 'Responsable', en: 'Assignee' },
  sinAsignar: { es: 'Sin asignar', en: 'Unassigned' },
  soltar: { es: 'Soltar', en: 'Release' },
  tomarla: { es: 'Tomarla', en: 'Take it' },
  canal: { es: 'Canal', en: 'Channel' },
  etiquetas: { es: 'Etiquetas', en: 'Tags' },
  quitarEtiqueta: { es: 'Quitar “{tag}”', en: 'Remove “{tag}”' },
  agregarEtiqueta: { es: '+ etiqueta', en: '+ tag' },
  etiquetaPlaceholder: { es: 'nombre y Enter', en: 'name, then Enter' },
  sinEtiquetas: { es: 'sin etiquetas', en: 'no tags' },
  actividad: { es: 'Actividad', en: 'Activity' },
  mensajes: { es: 'Mensajes', en: 'Messages' },
  delCliente: { es: 'Del cliente', en: 'From customer' },
  pendientes: { es: 'Pendientes', en: 'Pending' },
  automaticos: { es: 'Automáticos', en: 'Automated' },
  primerContacto: { es: 'Primer contacto', en: 'First contact' },
  ultimaRespuesta: { es: 'Última respuesta', en: 'Last reply' },
  automatica: { es: 'automática', en: 'automated' },
  sinNotas: {
    es: 'No hay notas en esta conversación. Escribí una con Ctrl + \\ desde el cuadro de mensaje.',
    en: 'No notes in this conversation. Write one with Ctrl + \\ from the message box.',
  },
}

export default { bandeja: BANDEJA }
