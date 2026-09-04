// La pantalla de ingreso, la barra de título de la app de escritorio, los
// avisos de error de la API y las piezas sueltas de `ui/`.
// Ver `textos/index.js`.

const LOGIN = {
  iniciarSesion: { es: 'Iniciar sesión', en: 'Sign in' },
  crearCuenta: { es: 'Crear cuenta', en: 'Create account' },
  acceso: { es: 'Acceso', en: 'Access' },
  holaDeNuevo: { es: 'Hola de nuevo', en: 'Welcome back' },
  pediTuAcceso: { es: 'Pedí tu acceso', en: 'Request access' },
  bajadaIngresar: {
    es: 'Entrá con Google o GitHub, o con tu usuario.',
    en: 'Sign in with Google or GitHub, or with your username.',
  },
  bajadaCrear: {
    es: 'Creá la cuenta con el mismo proveedor que uses todos los días, o pedile acceso al dueño del negocio.',
    en: 'Create the account with the provider you use every day, or ask the business owner for access.',
  },
  separadorCorreo: { es: 'o con tu correo', en: 'or with your email' },
  separadorCuenta: { es: 'o si ya tenés cuenta', en: 'or if you already have an account' },
  usuario: { es: 'Usuario', en: 'Username' },
  correo: { es: 'Correo', en: 'Email' },
  contrasena: { es: 'Contraseña', en: 'Password' },
  yaTengoCuenta: { es: 'Ya tengo una cuenta', en: 'I already have an account' },
  demoLocal: {
    es: 'Demo local — cualquier usuario y contraseña funcionan.',
    en: 'Local demo — any username and password work.',
  },
  titular: { es: 'Todo WhatsApp.', en: 'All of WhatsApp.' },
  titularAcento: { es: 'Una sola bandeja.', en: 'One single inbox.' },
  bajadaPanel: {
    es: 'La IA clasifica cada mensaje, contesta lo seguro y te deja el resto redactado para revisar.',
    en: 'The AI sorts every message, answers the safe ones, and leaves the rest drafted for you to review.',
  },
  ventajaRespuesta: { es: 'Respuesta al instante', en: 'Instant replies' },
  ventajaBorradores: { es: 'Borradores con IA', en: 'AI drafts' },
  ventajaDatos: { es: 'Datos por cliente', en: 'Per-client data' },
  faltaProveedor: { es: 'Ese proveedor no está disponible.', en: "That provider isn't available." },
  faltaSupabase: {
    es: 'Falta configurar el login social en el server (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).',
    en: 'Social login is not configured on the server (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).',
  },
  navegadorNoAbrio: {
    es: 'No se pudo abrir el navegador para continuar con el ingreso.',
    en: "Couldn't open the browser to continue signing in.",
  },
  faltanCredenciales: {
    es: 'Ingresá usuario y contraseña.',
    en: 'Enter your username and password.',
  },
  faltanCredencialesSocial: {
    es: 'Ingresá correo y contraseña.',
    en: 'Enter your email and password.',
  },
}

const BARRA = {
  archivo: { es: 'Archivo', en: 'File' },
  edicion: { es: 'Edición', en: 'Edit' },
  ver: { es: 'Ver', en: 'View' },
  ventana: { es: 'Ventana', en: 'Window' },
  ayuda: { es: 'Ayuda', en: 'Help' },
  cerrarVentana: { es: 'Cerrar ventana', en: 'Close window' },
  salir: { es: 'Salir', en: 'Quit' },
  deshacer: { es: 'Deshacer', en: 'Undo' },
  rehacer: { es: 'Rehacer', en: 'Redo' },
  cortar: { es: 'Cortar', en: 'Cut' },
  copiar: { es: 'Copiar', en: 'Copy' },
  pegar: { es: 'Pegar', en: 'Paste' },
  seleccionarTodo: { es: 'Seleccionar todo', en: 'Select all' },
  recargar: { es: 'Recargar', en: 'Reload' },
  recargarSinCache: { es: 'Recargar sin caché', en: 'Reload ignoring cache' },
  tamanoNormal: { es: 'Tamaño normal', en: 'Actual size' },
  acercar: { es: 'Acercar', en: 'Zoom in' },
  alejar: { es: 'Alejar', en: 'Zoom out' },
  temaClaro: { es: 'Tema claro', en: 'Light theme' },
  temaOscuro: { es: 'Tema oscuro', en: 'Dark theme' },
  pantallaCompleta: { es: 'Pantalla completa', en: 'Full screen' },
  herramientas: { es: 'Herramientas de desarrollo', en: 'Developer tools' },
  minimizar: { es: 'Minimizar', en: 'Minimize' },
  zoom: { es: 'Zoom', en: 'Zoom' },
  traerAlFrente: { es: 'Traer todo al frente', en: 'Bring all to front' },
  ayudaDeConext: { es: 'Ayuda de conext', en: 'conext help' },
}

// El aviso de que falló una llamada a la API. El hook guarda el origen como
// clave y no como frase: así el mismo error se lee en el idioma que esté puesto
// cuando se dibuja, y no en el que estaba cuando falló.
const ERRORES = {
  plantilla: { es: 'No se pudo {que}', en: "Couldn't {que}" },
  cerrarAviso: { es: 'Cerrar aviso', en: 'Dismiss notice' },
  sinServer: {
    es: 'No se pudo conectar con el server. ¿Está corriendo en el puerto 3001?',
    en: "Couldn't reach the server. Is it running on port 3001?",
  },
  adjuntoFallo: {
    es: 'No se pudo traer el adjunto ({status})',
    en: "Couldn't fetch the attachment ({status})",
  },
  cargaInicial: { es: 'la carga inicial', en: 'load the initial data' },
  actualizarDia: { es: 'actualizar el estado del día', en: 'refresh the day status' },
  actualizarMensajes: { es: 'actualizar mensajes', en: 'refresh messages' },
  actualizarBorradores: { es: 'actualizar borradores', en: 'refresh drafts' },
  actualizarConversaciones: { es: 'actualizar conversaciones', en: 'refresh conversations' },
  resolverConversacion: { es: 'resolver la conversación', en: 'resolve the conversation' },
  enviarMensaje: { es: 'enviar el mensaje', en: 'send the message' },
  enviarAdjunto: { es: 'enviar el adjunto', en: 'send the attachment' },
  agregarNota: { es: 'agregar la nota', en: 'add the note' },
  asignarConversacion: { es: 'asignar la conversación', en: 'assign the conversation' },
  cambiarAgente: { es: 'cambiar el agente', en: 'change the agent' },
  agregarEtiqueta: { es: 'agregar la etiqueta', en: 'add the tag' },
  quitarEtiqueta: { es: 'quitar la etiqueta', en: 'remove the tag' },
  cerrarDia: { es: 'cerrar el día', en: 'close the day' },
  abrirDia: { es: 'abrir el día', en: 'open the day' },
}

const UI = {
  elegir: { es: 'Elegir…', en: 'Choose…' },
  cerrar: { es: 'Cerrar', en: 'Close' },
  sinDatos: { es: 'Sin datos por el momento.', en: 'No data yet.' },
  verGrafico: { es: 'Ver gráfico', en: 'View chart' },
  verTabla: { es: 'Ver tabla', en: 'View table' },
  buscarEmoji: { es: 'Buscar emoji', en: 'Search emoji' },
  recientes: { es: 'Recientes', en: 'Recent' },
  sinEmojis: { es: 'Ningún emoji coincide.', en: 'No emoji matches.' },
  emojiCaritas: { es: 'Caritas', en: 'Smileys' },
  emojiGestos: { es: 'Gestos', en: 'Gestures' },
  emojiSimbolos: { es: 'Símbolos', en: 'Symbols' },
  emojiTrabajo: { es: 'Trabajo', en: 'Work' },
  emojiComida: { es: 'Comida', en: 'Food' },
  emojiClima: { es: 'Clima', en: 'Weather' },
}

// El modal que se ve una sola vez, la primera vez que alguien entra a la
// dashboard. Habla en segunda persona y nombra a la persona: es lo único que
// separa una bienvenida de un aviso.
const BIENVENIDA = {
  titulo: {
    es: ({ nombre }) => `Te damos la bienvenida, ${nombre}`,
    en: ({ nombre }) => `Welcome aboard, ${nombre}`,
  },
  bajada: {
    es: 'Todos los mensajes de WhatsApp, Instagram y Messenger entran a una sola bandeja, y la IA contesta lo seguro y te deja el resto redactado. Son tres pasos hasta el primer mensaje.',
    en: 'Every WhatsApp, Instagram and Messenger message lands in a single inbox, and the AI answers the safe ones and leaves the rest drafted for you. It takes three steps to your first message.',
  },
  empezaAca: { es: 'Empezá acá', en: 'Start here' },
  pasoCanalesTitulo: { es: 'Conectá tus canales', en: 'Connect your channels' },
  pasoCanalesBajada: {
    es: 'WhatsApp por un lado, la Página de Facebook para Instagram y Messenger.',
    en: 'WhatsApp on one side, the Facebook Page for Instagram and Messenger.',
  },
  pasoAgentesTitulo: { es: 'Armá tu primer agente', en: 'Build your first agent' },
  pasoAgentesBajada: {
    es: 'Qué sabe, cómo habla y hasta dónde puede contestar sin pedirte permiso.',
    en: 'What it knows, how it talks and how far it can answer without asking you.',
  },
  pasoBandejaTitulo: { es: 'Mirá la bandeja', en: 'Take a look at the inbox' },
  pasoBandejaBajada: {
    es: 'Lo automático ya salió; lo pendiente te espera con el borrador escrito.',
    en: 'The automatic ones already went out; the pending ones wait with a draft ready.',
  },
  noMostrar: { es: 'No volver a mostrar', en: "Don't show this again" },
  saltar: { es: 'Saltar el tour', en: 'Skip the tour' },
  hacer: { es: 'Hacer el tour', en: 'Take the tour' },
}

// El recorrido guiado (`components/Tour.jsx`). Cada paso habla de lo que está
// señalando en la pantalla en ese momento, así que las bajadas dicen lo que no
// se ve —qué decide esa pieza, qué pasa si no se toca— y no lo que ya está a la
// vista. Dos renglones cada una: la tarjeta es chica a propósito.
const TOUR = {
  aria: { es: 'Recorrido guiado', en: 'Guided tour' },
  progreso: {
    es: ({ n, total }) => `Paso ${n} de ${total}`,
    en: ({ n, total }) => `Step ${n} of ${total}`,
  },
  atras: { es: 'Atrás', en: 'Back' },
  siguiente: { es: 'Siguiente', en: 'Next' },
  terminar: { es: 'Empezar', en: 'Get started' },
  salir: { es: 'Salir del recorrido', en: 'Exit the tour' },

  inicioTitulo: { es: 'Tu día, de un vistazo', en: 'Your day at a glance' },
  inicioBajada: {
    es: 'Cuántos mensajes entraron, cuántos quedaron esperando y qué parte contestó sola la IA. Los números son siempre los del día abierto.',
    en: 'How many messages came in, how many are still waiting and how much the AI answered on its own. The numbers always belong to the open day.',
  },
  barraTitulo: { es: 'Todo se navega desde acá', en: 'Everything starts here' },
  barraBajada: {
    es: 'Inicio, bandeja, agentes, catálogo, plantillas y ajustes. La barra es la misma en todas las pantallas, así que nunca hay que volver atrás para cambiar de sección.',
    en: 'Home, inbox, agents, catalog, templates and settings. The sidebar is the same on every screen, so you never have to go back to switch sections.',
  },
  carpetasTitulo: { es: 'Tus carpetas y tus agentes', en: 'Your folders and your agents' },
  carpetasBajada: {
    es: 'Mías, sin asignar y pendientes filtran la bandeja desde cualquier pantalla. Abajo va cada agente, con las conversaciones que está atendiendo.',
    en: 'Mine, unassigned and pending filter the inbox from any screen. Below sits each agent, with the conversations it is handling.',
  },
  diaTitulo: { es: 'El día se abre y se cierra a mano', en: 'The day opens and closes by hand' },
  diaBajada: {
    es: 'Es la unidad de trabajo del CRM, y no la fecha: sin un día abierto no se envían mensajes ni se agregan notas. Al cerrarlo queda archivado y se puede volver a leer.',
    en: "It's the CRM's unit of work, not the calendar date: with no open day nothing can be sent and no notes can be added. Closing it files the day away, still readable.",
  },
  listaTitulo: { es: 'Los tres canales, una sola lista', en: 'Three channels, one list' },
  listaBajada: {
    es: 'WhatsApp, Instagram y Messenger entran acá mezclados. El distintivo del avatar es lo único que dice por dónde se contesta cada conversación.',
    en: 'WhatsApp, Instagram and Messenger all land here together. The badge on the avatar is the one thing telling you which channel each conversation answers through.',
  },
  hiloTitulo: { es: 'La conversación completa', en: 'The whole conversation' },
  hiloBajada: {
    es: 'Lo que contestó la IA lleva un rayo al lado de la hora. Lo que sigue pendiente se ve por el tinte del globo, sin que haya que leer ningún cartel.',
    en: 'Whatever the AI answered carries a bolt next to the time. Anything still pending shows in the tint of the bubble, with no label to read.',
  },
  composerTitulo: { es: 'Contestar, adjuntar o anotar', en: 'Reply, attach or take a note' },
  composerBajada: {
    es: 'Texto, emojis, archivos y notas de voz. La nota interna es para el equipo y no le llega al cliente: mientras esté puesta, el cuadro entero se tiñe.',
    en: 'Text, emojis, files and voice notes. An internal note is for your team and never reaches the customer: while it is on, the whole box changes color.',
  },
  fichaTitulo: { es: 'La ficha del contacto', en: 'The contact card' },
  fichaBajada: {
    es: 'Quién atiende, qué etiquetas tiene y cuántos mensajes quedan pendientes. Desde acá se asigna, se resuelve y se busca adentro del hilo.',
    en: 'Who is handling it, which tags it carries and how many messages are pending. Assign, resolve and search inside the thread from here.',
  },
  agentesTitulo: { es: 'Los agentes contestan por vos', en: 'The agents answer for you' },
  agentesBajada: {
    es: 'Cada uno sabe de un tema, tiene su tono y decide hasta dónde puede contestar sin preguntarte. El primero encendido atiende lo que no encaja en ninguno.',
    en: "Each one knows a topic, has its own tone and decides how far it can answer without asking you. The first one enabled takes whatever fits none of them.",
  },
  canalesTitulo: { es: 'Enganchá tus canales', en: 'Connect your channels' },
  canalesBajada: {
    es: 'WhatsApp va por su lado; la Página de Facebook trae Instagram y Messenger juntos. Hasta que conectes al menos uno, la bandeja queda vacía.',
    en: 'WhatsApp goes on its own; the Facebook Page brings Instagram and Messenger together. Until you connect at least one, the inbox stays empty.',
  },
  finalTitulo: { es: 'Listo, es tuya', en: "That's it — it's yours" },
  finalBajada: {
    es: 'Podés volver a ver este recorrido cuando quieras desde Configuración → General. Lo que sigue es conectar un canal y esperar el primer mensaje.',
    en: 'You can take this tour again any time from Settings → General. What comes next is connecting a channel and waiting for the first message.',
  },
}

export default {
  login: LOGIN,
  barra: BARRA,
  errores: ERRORES,
  ui: UI,
  bienvenida: BIENVENIDA,
  tour: TOUR,
}
