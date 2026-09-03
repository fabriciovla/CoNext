// Los textos de Inicio, Productos, Agentes y Plantillas. Ver `textos/index.js`.

const INICIO = {
  titulo: { es: 'Inicio', en: 'Home' },
  cargando: { es: 'Cargando el resumen del día', en: 'Loading the day summary' },
  contextoAbierto: { es: 'día abierto desde las {hora}', en: 'day open since {hora}' },
  contextoCerrado: { es: 'día cerrado a las {hora}', en: 'day closed at {hora}' },
  contextoCerradoSinHora: { es: 'día cerrado', en: 'day closed' },
  contextoSinAbrir: { es: 'todavía no abriste el día', en: "you haven't opened the day yet" },

  kpiMensajes: { es: 'Mensajes hoy', en: 'Messages today' },
  kpiMensajesHint: {
    es: ({ n }) => `en ${n} conversación${n === 1 ? '' : 'es'}`,
    en: ({ n }) => `across ${n} conversation${n === 1 ? '' : 's'}`,
  },
  kpiPendientes: { es: 'Pendientes', en: 'Pending' },
  kpiPendientesCero: { es: 'nada sin responder', en: 'nothing unanswered' },
  kpiPendientesHint: { es: 'esperando respuesta', en: 'waiting for a reply' },
  kpiAutomatizacion: { es: 'Automatización', en: 'Automation' },
  kpiAutomatizacionHint: {
    es: '{automaticos} de {total} resueltos por el bot',
    en: '{automaticos} of {total} handled by the bot',
  },
  kpiRespuesta: { es: 'Respuesta promedio', en: 'Average reply time' },
  kpiRespuestaSinDatos: { es: 'sin respuestas medidas', en: 'no replies measured' },
  kpiRespuestaHint: {
    es: 'desde que escribe el cliente',
    en: 'from the moment the customer writes',
  },

  requiereAtencion: { es: 'Requiere tu atención', en: 'Needs your attention' },
  verBandeja: { es: 'Ver bandeja', en: 'Open inbox' },
  todoRespondido: {
    es: 'Ninguna conversación pendiente: está todo respondido.',
    en: 'No pending conversations — everything is answered.',
  },
  esperando: { es: '{tiempo} esperando', en: 'waiting {tiempo}' },

  actividadMensajes: { es: 'Actividad de mensajes', en: 'Message activity' },
  ultimos12Meses: { es: 'Últimos 12 meses', en: 'Last 12 months' },
  serieMensajes: { es: 'Mensajes', en: 'Messages' },
  serieAutomaticos: { es: 'Automáticos', en: 'Automated' },

  mensajesPorHora: { es: 'Mensajes por hora (hoy)', en: 'Messages by hour (today)' },
  pico: {
    es: ({ hora, n }) => `Pico: ${hora}:00 h · ${n} mensajes`,
    en: ({ hora, n }) => `Peak: ${hora}:00 · ${n} messages`,
  },
  horaTooltip: {
    es: ({ hora, n }) => `${hora}:00 h — ${n} mensaje${n === 1 ? '' : 's'}`,
    en: ({ hora, n }) => `${hora}:00 — ${n} message${n === 1 ? '' : 's'}`,
  },
  sinMensajesHoy: {
    es: 'Todavía no entraron mensajes en este día.',
    en: 'No messages have come in on this day yet.',
  },

  automatizacionVsManual: {
    es: 'Automatización vs. revisión manual (hoy)',
    en: 'Automation vs. manual review (today)',
  },
  automaticos: { es: 'Automáticos', en: 'Automated' },
  pendientesDeRevision: { es: 'Pendientes de revisión', en: 'Awaiting review' },

  estadoDelDia: { es: 'Estado del día', en: 'Day status' },
  horarioDeAtencion: { es: 'Horario de atención', en: 'Business hours' },
  turnoAnterior: { es: 'Turno del día anterior', en: "Previous day's shift" },
  cerradoHoy: { es: 'Cerrado hoy', en: 'Closed today' },
  segunConfiguracion: { es: '{dia}, según tu configuración', en: '{dia}, per your settings' },
  mensajesEnBandeja: { es: 'Mensajes en la bandeja', en: 'Messages in the inbox' },
  diasArchivados: { es: 'Días archivados', en: 'Archived days' },
  irALaBandeja: { es: 'Ir a la bandeja', en: 'Go to the inbox' },
  editarHorarios: { es: 'Editar horarios', en: 'Edit hours' },
  horarioAtendiendo: { es: 'Atendiendo ahora', en: 'Open right now' },
  horarioNoAbriste: { es: 'Todavía no abriste', en: "Haven't opened yet" },
  horarioFuera: { es: 'Fuera de horario', en: 'Outside business hours' },
  horarioNoLaborable: { es: 'Hoy no se atiende', en: 'Closed today' },

  tasaResolucion: { es: 'Tasa de resolución', en: 'Resolution rate' },
  tasaResolucionSub: {
    es: '{resueltos} de {total} mensajes resueltos hoy',
    en: '{resueltos} of {total} messages resolved today',
  },

  respuestasEnviadas: { es: 'Respuestas enviadas', en: 'Replies sent' },
  sinRespuestasHoy: {
    es: 'Todavía no salió ninguna respuesta en este día.',
    en: 'No reply has gone out on this day yet.',
  },
  lasMandoElBot: { es: 'las mandó el bot', en: 'sent by the bot' },
  bot: { es: 'Bot', en: 'Bot' },
  manuales: { es: 'Manuales', en: 'Manual' },

  alertasStock: { es: 'Alertas de stock', en: 'Stock alerts' },
  productos: { es: 'Productos', en: 'Products' },
  stockSuficiente: {
    es: 'Todos los productos tienen stock suficiente.',
    en: 'Every product has enough stock.',
  },
  sinStock: { es: 'Sin stock', en: 'Out of stock' },
  bajo: { es: 'Bajo', en: 'Low' },
  unidadesCorto: { es: '{n} u.', en: '{n} u.' },
  resumenProductos: {
    es: ({ n, sinStock }) =>
      `${n} producto${n === 1 ? '' : 's'}` + (sinStock > 0 ? ` · ${sinStock} sin stock` : ''),
    en: ({ n, sinStock }) =>
      `${n} product${n === 1 ? '' : 's'}` + (sinStock > 0 ? ` · ${sinStock} out of stock` : ''),
  },
  enInventario: { es: '{valor} en inventario', en: '{valor} in inventory' },
}

const PRODUCTOS = {
  titulo: { es: 'Productos', en: 'Products' },
  bajada: {
    es: 'El catálogo del que salen los precios y el stock que contestan tus agentes.',
    en: 'The catalog your agents quote prices and stock from.',
  },
  nuevoProducto: { es: 'Nuevo producto', en: 'New product' },
  todosLosProductos: { es: 'Todos los productos', en: 'All products' },
  todos: { es: 'Todos', en: 'All' },
  sinCarpeta: { es: 'Sin carpeta', en: 'No folder' },
  carpetas: { es: 'Carpetas', en: 'Folders' },
  carpetasDelCatalogo: { es: 'Carpetas del catálogo', en: 'Catalog folders' },
  soltaParaMover: { es: 'Soltá para mover', en: 'Drop to move' },
  nuevaCarpeta: { es: 'Nueva carpeta', en: 'New folder' },
  crearCarpeta: { es: 'Crear carpeta', en: 'Create folder' },
  renombrarCarpeta: { es: 'Renombrar carpeta', en: 'Rename folder' },
  verCarpeta: { es: 'Ver {nombre}', en: 'View {nombre}' },
  renombrarNombre: { es: 'Renombrar {nombre}', en: 'Rename {nombre}' },
  eliminarNombre: { es: 'Eliminar {nombre}', en: 'Delete {nombre}' },
  nombreCarpetaPlaceholder: { es: 'Bebidas', en: 'Drinks' },
  buscarPlaceholder: { es: 'Buscar…', en: 'Search…' },
  buscarProducto: { es: 'Buscar producto', en: 'Search products' },
  limpiarBusqueda: { es: 'Limpiar búsqueda', en: 'Clear search' },
  sinStock: { es: 'Sin stock', en: 'Out of stock' },
  stockBajo: { es: 'Stock bajo', en: 'Low stock' },
  stockBajoQuedan: { es: 'Stock bajo, quedan {n}', en: 'Low stock, {n} left' },
  enStock: { es: '{n} en stock', en: '{n} in stock' },
  mostrarTodos: { es: 'Mostrar todos', en: 'Show all' },
  verSinStock: { es: 'Ver solo los que no tienen stock', en: 'Show only those out of stock' },
  verStockBajo: { es: 'Ver solo los de stock bajo', en: 'Show only low stock' },
  datoProductos: { es: 'productos', en: 'products' },
  datoSinStock: { es: 'sin stock', en: 'out of stock' },
  datoStockBajo: { es: 'stock bajo', en: 'low stock' },
  datoInventario: { es: 'en inventario', en: 'in inventory' },

  vacioSinResultadosTitulo: { es: 'Sin resultados', en: 'No results' },
  vacioSinResultados: {
    es: 'Ningún producto coincide con “{query}”.',
    en: 'No product matches “{query}”.',
  },
  vacioSinStockTitulo: { es: 'Nada sin stock', en: 'Nothing out of stock' },
  vacioSinStock: { es: 'Ninguno se quedó en cero en esta vista.', en: 'None hit zero in this view.' },
  vacioBajoTitulo: { es: 'Nada por reponer', en: 'Nothing to restock' },
  vacioBajo: {
    es: 'Ninguno tiene el stock bajo en esta vista.',
    en: 'None are low on stock in this view.',
  },
  vacioSueltosTitulo: { es: 'No hay productos sueltos', en: 'No loose products' },
  vacioSueltos: {
    es: 'Todos están guardados en alguna carpeta.',
    en: 'They are all filed in a folder.',
  },
  vacioCarpetaTitulo: { es: 'La carpeta está vacía', en: 'This folder is empty' },
  vacioCarpeta: {
    es: 'Arrastrá un producto hasta acá para moverlo.',
    en: 'Drag a product here to move it.',
  },
  vacioCatalogoTitulo: {
    es: 'Todavía no cargaste productos',
    en: "You haven't added any products yet",
  },
  vacioCatalogo: {
    es: 'Hasta que haya alguno, tus agentes no pueden contestar por precios ni por stock.',
    en: "Until there's at least one, your agents can't answer about prices or stock.",
  },

  editarProducto: { es: 'Editar producto', en: 'Edit product' },
  eliminarProducto: { es: 'Eliminar producto', en: 'Delete product' },
  confirmarBorrado: {
    es: 'Los agentes dejan de ofrecerlo cuando alguien pregunte por el catálogo.',
    en: 'Agents stop offering it when someone asks about the catalog.',
  },
  seVaAEliminar: { es: 'Se va a eliminar', en: 'This will delete' },
  eliminarCarpeta: { es: 'Eliminar carpeta', en: 'Delete folder' },
  seVaAEliminarCarpeta: { es: 'Se va a eliminar la carpeta', en: 'This will delete the folder' },
  carpetaVacia: { es: 'No tiene productos adentro.', en: 'It has no products inside.' },
  carpetaUno: {
    es: 'El producto que tiene adentro no se borra: queda sin carpeta.',
    en: "The product inside isn't deleted: it just loses its folder.",
  },
  carpetaVarios: {
    es: 'Los {n} productos que tiene adentro no se borran: quedan sin carpeta.',
    en: "The {n} products inside aren't deleted: they just lose their folder.",
  },

  campoNombre: { es: 'Nombre', en: 'Name' },
  campoNombrePlaceholder: { es: 'Coca-Cola 1.5 L', en: 'Coca-Cola 1.5 L' },
  campoCarpeta: { es: 'Carpeta', en: 'Folder' },
  campoCarpetaAria: { es: 'Carpeta del producto', en: 'Product folder' },
  campoPrecio: { es: 'Precio', en: 'Price' },
  campoStock: { es: 'Stock', en: 'Stock' },
}

const AGENTES = {
  titulo: { es: 'Agentes IA', en: 'AI agents' },
  bajada: {
    es: 'Contesta el agente que mejor encaje con la consulta. Tocá uno para configurarlo.',
    en: 'Whichever agent fits the question answers it. Tap one to configure it.',
  },
  nuevoAgente: { es: 'Nuevo agente', en: 'New agent' },
  editarNombre: { es: 'Editar {nombre}', en: 'Edit {nombre}' },
  borrarNombre: { es: 'Borrar {nombre}', en: 'Delete {nombre}' },
  apagarNombre: { es: 'Apagar {nombre}', en: 'Turn off {nombre}' },
  encenderNombre: { es: 'Encender {nombre}', en: 'Turn on {nombre}' },
  subirEnLista: { es: 'Subir en la lista', en: 'Move up' },
  bajarEnLista: { es: 'Bajar en la lista', en: 'Move down' },
  encendido: { es: 'Encendido', en: 'On' },
  apagado: { es: 'Apagado', en: 'Off' },
  porDefecto: { es: '· por defecto', en: '· default' },
  porDefectoTitle: {
    es: 'Contesta cuando ningún agente encaja',
    en: 'Answers when no agent clearly fits',
  },
  dejaBorrador: { es: '· deja borrador', en: '· leaves a draft' },
  dejaBorradorTitle: {
    es: 'Escribe la respuesta pero te la deja como borrador',
    en: 'Writes the reply but leaves it as a draft for you',
  },
  sinRol: {
    es: 'Todavía no dijiste de qué se encarga.',
    en: "You haven't said what it handles yet.",
  },
  datoConversaciones: { es: 'conversaciones', en: 'conversations' },
  datoMensajes: { es: 'mensajes', en: 'messages' },
  datoContestoSolo: { es: 'contestó solo', en: 'answered alone' },
  datoParaRevisar: { es: 'para revisar', en: 'to review' },
  vacioTitulo: { es: 'Todavía no hay agentes', en: 'No agents yet' },
  vacioTexto: {
    es: 'Sin al menos uno encendido, todos los mensajes te quedan a vos para contestar a mano.',
    en: 'Without at least one turned on, every message is left for you to answer by hand.',
  },
  campoNombre: { es: '¿Cómo se llama?', en: "What's its name?" },
  campoNombrePlaceholder: { es: 'Agente de ventas', en: 'Sales agent' },
  campoRol: { es: '¿De qué se encarga?', en: 'What does it handle?' },
  campoRolHint: {
    es: 'Los temas que tiene que atender. Con esto se decide a cuál de tus agentes le toca cada mensaje que llega.',
    en: 'The topics it should cover. This is what decides which of your agents gets each incoming message.',
  },
  campoRolPlaceholder: {
    es: 'Precios, stock, formas de pago y si hacemos envíos.',
    en: 'Prices, stock, payment methods and whether we ship.',
  },
  campoInstrucciones: { es: '¿Cómo tiene que contestar?', en: 'How should it reply?' },
  campoInstruccionesHint: {
    es: 'El tono y lo que no puede olvidarse. Los precios, el catálogo y los horarios los saca de tu configuración, no se los inventa.',
    en: "The tone and what it must not forget. Prices, catalog and hours come from your settings — it doesn't make them up.",
  },
  campoInstruccionesPlaceholder: {
    es: 'Contestá corto y amable, y ofrecé siempre el envío a domicilio.',
    en: 'Keep it short and friendly, and always offer home delivery.',
  },
  switchEncendido: { es: 'Encendido', en: 'Turned on' },
  switchEncendidoHint: {
    es: 'Apagado, este agente no contesta nada y sus mensajes pasan al primero de la lista.',
    en: 'Turned off, this agent answers nothing and its messages go to the first one on the list.',
  },
  switchAutoSend: { es: 'Contesta solo', en: 'Replies on its own' },
  switchAutoSendHint: {
    es: 'Apagado, escribe la respuesta igual pero te la deja como borrador para que la revises antes de mandarla.',
    en: 'Turned off, it still writes the reply but leaves it as a draft for you to review before sending.',
  },
  guardarCambios: { es: 'Guardar cambios', en: 'Save changes' },
  crearAgente: { es: 'Crear agente', en: 'Create agent' },
  borrarAgente: { es: 'Borrar agente', en: 'Delete agent' },
  seVaABorrar: { es: 'Se va a borrar', en: 'This will delete' },
  borrarDetalle: {
    es: 'Las conversaciones que venía atendiendo pasan al primer agente encendido; los mensajes que ya mandó quedan como están.',
    en: 'The conversations it was handling move to the first agent that is on; the messages it already sent stay as they are.',
  },
}

const PLANTILLAS = {
  titulo: { es: 'Plantillas', en: 'Templates' },
  bajadaAntes: {
    es: 'Son los mensajes con los que podés escribir ',
    en: 'These are the messages you can use to write ',
  },
  bajadaFuerte: { es: 'primero', en: 'first' },
  bajadaDespues: {
    es: '. Pasadas 24 horas desde el último mensaje del contacto, WhatsApp solo deja mandar una plantilla aprobada.',
    en: ". Once 24 hours have passed since the contact's last message, WhatsApp only allows an approved template.",
  },
  actualizarEstados: { es: 'Actualizar estados', en: 'Refresh statuses' },
  nuevaPlantilla: { es: 'Nueva plantilla', en: 'New template' },
  sinWhatsapp: {
    es: 'Este negocio todavía no conectó su WhatsApp, así que no hay cuenta de dónde traer las plantillas. Conectalo desde Configuración.',
    en: "This business hasn't connected its WhatsApp yet, so there's no account to pull templates from. Connect it in Settings.",
  },
  vacioTitulo: { es: 'Todavía no hay ninguna plantilla', en: 'No templates yet' },
  vacioTexto: {
    es: 'La primera suele ser la del pedido en camino: es la que más se manda y la que más rápido aprueban.',
    en: 'The first one is usually the order-on-its-way message: the most sent and the fastest to get approved.',
  },
  estadoAprobada: { es: 'Aprobada', en: 'Approved' },
  estadoEnRevision: { es: 'En revisión', en: 'In review' },
  estadoEnApelacion: { es: 'En apelación', en: 'In appeal' },
  estadoRechazada: { es: 'Rechazada', en: 'Rejected' },
  estadoPausada: { es: 'Pausada', en: 'Paused' },
  estadoDeshabilitada: { es: 'Deshabilitada', en: 'Disabled' },
  categoriaMarketing: { es: 'Marketing', en: 'Marketing' },
  categoriaUtilidad: { es: 'Utilidad', en: 'Utility' },
  rechazoMeta: { es: 'Meta la rechazó: {motivo}', en: 'Meta rejected it: {motivo}' },
  borrarPlantilla: { es: 'Borrar plantilla', en: 'Delete template' },
  borrarPlantillaAria: { es: 'Borrar la plantilla {nombre}', en: 'Delete the {nombre} template' },
  borrarAntes: { es: 'Se borra ', en: 'This deletes ' },
  borrarDespues: {
    es: ' de la cuenta de WhatsApp, en todos sus idiomas. Para volver a tenerla hay que crearla de nuevo y esperar que Meta la apruebe otra vez.',
    en: ' from the WhatsApp account, in every language. To get it back you have to create it again and wait for Meta to approve it once more.',
  },
  campoNombre: { es: 'Nombre', en: 'Name' },
  campoNombreHint: {
    es: 'Es el nombre interno con el que se manda, no lo ve el contacto. Se guarda en minúscula y con guiones bajos.',
    en: "It's the internal name used to send it — the contact never sees it. Saved in lowercase with underscores.",
  },
  campoCategoria: { es: 'Categoría', en: 'Category' },
  categoriaUtilidadLarga: {
    es: 'Utilidad — avisos de un pedido, turnos, envíos',
    en: 'Utility — order updates, appointments, shipping',
  },
  categoriaMarketingLarga: {
    es: 'Marketing — promociones, novedades, catálogo',
    en: 'Marketing — promotions, news, catalog',
  },
  // Los idiomas de una plantilla son los de Meta, no los de la dashboard: es en
  // qué idioma le va a llegar el mensaje al cliente. La lista es la misma en
  // los dos, solo cambia cómo se nombra cada uno.
  campoIdioma: { es: 'Idioma', en: 'Language' },
  idiomaEsAr: { es: 'Español (Argentina)', en: 'Spanish (Argentina)' },
  idiomaEs: { es: 'Español', en: 'Spanish' },
  idiomaEsMx: { es: 'Español (México)', en: 'Spanish (Mexico)' },
  idiomaEnUs: { es: 'Inglés (EE.UU.)', en: 'English (US)' },
  idiomaPtBr: { es: 'Portugués (Brasil)', en: 'Portuguese (Brazil)' },
  campoMensaje: { es: 'Mensaje', en: 'Message' },
  campoMensajePlaceholder: {
    es: 'Hola {{1}}, tu pedido ya salió y llega el {{2}}.',
    en: 'Hi {{1}}, your order is on its way and arrives on {{2}}.',
  },
  campoNombrePlaceholder: { es: 'pedido_enviado', en: 'order_shipped' },
  variablesAntes: { es: 'Con ', en: 'With ' },
  variablesDespues: {
    es: '… dejás huecos que se completan al mandar. Van numeradas desde 1 y sin saltos.',
    en: '… you leave blanks that get filled in when sending. Numbered from 1, with no gaps.',
  },
  campoPie: { es: 'Pie (opcional)', en: 'Footer (optional)' },
  campoPiePlaceholder: {
    es: 'Respondé este mensaje si necesitás algo',
    en: 'Reply to this message if you need anything',
  },
  revisaMeta: {
    es: 'La revisa Meta antes de que se pueda usar. Suele tardar unos minutos.',
    en: 'Meta reviews it before it can be used. It usually takes a few minutes.',
  },
  enviando: { es: 'Enviando…', en: 'Sending…' },
  crearPlantilla: { es: 'Crear plantilla', en: 'Create template' },
}

export default {
  inicio: INICIO,
  productos: PRODUCTOS,
  agentes: AGENTES,
  plantillas: PLANTILLAS,
}
