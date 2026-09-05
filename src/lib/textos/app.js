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

// La espera de después de pagar, mientras el webhook de Dodo termina de llegar
// (ver `lib/alta.js`). Dice dos cosas y nada más: que el pago se está
// acreditando y que no hay nada que hacer. Quien lee esto todavía no vio la
// dashboard nunca, así que no se la nombra como si ya la conociera.
const ALTA = {
  preparandoTitulo: {
    es: 'Estamos preparando tu espacio',
    en: 'Setting up your workspace',
  },
  preparandoBajada: {
    es: 'Tu pago se está acreditando. Esto tarda unos segundos y no hace falta que hagas nada.',
    en: 'Your payment is going through. This takes a few seconds and there is nothing you need to do.',
  },
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
  // El cartel de "Empezá acá" que llevaba la primera fila se fue: ahora las tres
  // van numeradas, que dice el orden entero y no solo dónde arranca.
  tourInteractivo: {
    es: 'El recorrido se hace sobre la app de verdad y en varios pasos te toca a vos: abrís una conversación, escribís un mensaje. Nada de lo que hagas ahí le llega a un cliente.',
    en: 'The tour runs on the real app, and several steps hand you the controls: you open a conversation, you type a message. Nothing you do in there reaches a customer.',
  },
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

  // Los pasos en los que le toca al admin. La pista dice **qué tocar y para
  // qué**, en ese orden y en una sola oración: en pantalla convive con un
  // anillo latiendo sobre la pieza, así que repetir dónde está sería decir dos
  // veces lo mismo.
  tuTurno: { es: 'Te toca', en: 'Your turn' },
  hecho: { es: '¡Listo!', en: 'Nice!' },
  loHiciste: { es: 'Esto ya lo hiciste.', en: 'You already did this one.' },
  seguirSin: { es: 'Seguir sin probar', en: 'Skip this one' },
  accionBarra: {
    es: 'Tocá “Bandeja” para entrar: es la carpeta con todas las conversaciones.',
    en: 'Tap “Inbox” to go in: it’s the folder holding every conversation.',
  },
  accionCarpetas: {
    es: 'Probá “Pendientes”: deja a la vista solo lo que todavía espera respuesta.',
    en: 'Try “Pending”: it leaves only what’s still waiting for an answer.',
  },
  accionLista: {
    es: 'Abrí una conversación. Cualquiera sirve — se abre a la derecha, entera.',
    en: 'Open a conversation. Any of them — it opens in full on the right.',
  },
  accionComposer: {
    es: 'Escribí algo en el cuadro. Mientras dure el recorrido no se envía nada.',
    en: 'Type something in the box. Nothing gets sent while the tour is running.',
  },
  finalHechos: {
    es: ({ n, total }) =>
      n === total
        ? `Hiciste las ${total} cosas que te pedí por tu cuenta.`
        : `Hiciste ${n} de ${total} cosas por tu cuenta.`,
    en: ({ n, total }) =>
      n === total
        ? `You did all ${total} things yourself.`
        : `You did ${n} of ${total} things yourself.`,
  },
  finalConectar: { es: 'Conectar un canal', en: 'Connect a channel' },

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
    es: 'Un agente son dos cosas: el rol, que dice cuándo entra, y las instrucciones, que dicen cómo escribe. Entrá a Agentes cuando termine este recorrido y te acompaño a armar el primero, paso por paso.',
    en: 'An agent is two things: the role, which says when it steps in, and the instructions, which say how it writes. Head into Agents when this tour ends and I will walk you through building the first one, step by step.',
  },
  canalesTitulo: { es: 'Enganchá tus canales', en: 'Connect your channels' },
  canalesBajada: {
    es: 'WhatsApp va por su lado; la Página de Facebook trae Instagram y Messenger juntos. Hasta que conectes al menos uno, la bandeja queda vacía.',
    en: 'WhatsApp goes on its own; the Facebook Page brings Instagram and Messenger together. Until you connect at least one, the inbox stays empty.',
  },
  finalTitulo: { es: 'Listo, es tuya', en: "That's it — it's yours" },
  // Lo que sigue no se nombra acá: el paso lo ofrece con un botón, y decirlo
  // además en la bajada es escribir dos veces el mismo renglón.
  finalBajada: {
    es: 'Podés volver a ver este recorrido cuando quieras desde Configuración → General.',
    en: 'You can take this tour again any time from Settings → General.',
  },
}

// El segundo recorrido: armar el primer agente, y que sea un recepcionista.
//
// Los textos de rol e instrucciones van escritos enteros, listos para copiar, y
// no como una consigna ("describí cuándo entra"). Esa consigna ya está en la
// pantalla, abajo de cada rótulo, y aún así frente al campo vacío no se sabe qué
// poner: lo que falta no es la definición, es un ejemplo que sirva tal cual.
//
// Recepcionista y no vendedor: es el agente que le sirve a cualquier negocio
// —atiende al que escribe por primera vez, entiende qué necesita y deriva— y el
// ejemplo se puede dejar como está. Uno de un rubro puntual hay que reescribirlo
// entero antes de que sirva, que es lo mismo que no darlo.
const TOUR_AGENTE = {
  abrirTitulo: { es: 'Armemos tu primer agente', en: "Let's build your first agent" },
  abrirBajada: {
    es: 'Un recepcionista: el que atiende al que escribe por primera vez, entiende qué necesita y lo deriva. Le sirve a cualquier negocio y es el que conviene tener andando primero.',
    en: 'A receptionist: the one who greets whoever writes in for the first time, works out what they need and points them onward. It fits any business and it is the one worth having running first.',
  },
  accionAbrir: {
    es: 'Tocá “Nuevo agente”. Se abre la pantalla donde se lo arma.',
    en: 'Tap “New agent”. That opens the screen where you build it.',
  },

  nombreTitulo: { es: 'Ponele nombre y cara', en: 'Give it a name and a face' },
  nombreBajada: {
    es: 'El nombre y el emoji son para vos: es cómo lo vas a reconocer en la bandeja y en las carpetas de la barra. El cliente no los ve nunca.',
    en: 'The name and the emoji are for you: it is how you will spot it in the inbox and in the sidebar folders. The customer never sees them.',
  },
  accionNombre: {
    es: 'Escribí “Recepcionista” en el nombre.',
    en: 'Type “Receptionist” in the name field.',
  },

  rolTitulo: { es: 'El rol dice cuándo entra', en: 'The role says when it steps in' },
  rolBajada: {
    es: 'Es lo único que el modelo compara contra el mensaje que llega para elegir quién atiende. No es la descripción del puesto: es en qué casos le toca a este.',
    en: 'It is the only thing the model matches against the incoming message to pick who answers. It is not a job description: it is which cases belong to this one.',
  },
  accionRol: {
    es: 'Copiá esto: “Atiende el primer mensaje de alguien que escribe por primera vez, los saludos y las consultas generales que todavía no se sabe de qué son.”',
    en: 'Copy this: “Handles the first message from anyone writing in for the first time, greetings, and general questions that are still unclear.”',
  },

  instruccionesTitulo: {
    es: 'Las instrucciones dicen cómo escribe',
    en: 'The instructions say how it writes',
  },
  instruccionesBajada: {
    es: 'Acá van el tono y los límites: qué puede contestar solo y qué te tiene que dejar a vos. Cuanto más concreto, menos se lo inventa.',
    en: 'Tone and limits go here: what it can answer on its own and what it has to leave to you. The more concrete, the less it makes up.',
  },
  accionInstrucciones: {
    es: 'Copiá esto: “Saludá con el nombre del negocio, preguntá en qué podés ayudar y contestá corto. Nunca inventes precios, plazos ni stock: si no está en el catálogo, decí que lo consultás y avisás.”',
    en: 'Copy this: “Greet using the business name, ask how you can help, and keep it short. Never make up prices, delivery times or stock: if it is not in the catalog, say you will check and get back to them.”',
  },

  comportamientoTitulo: {
    es: 'Contestar solo, o dejarte el borrador',
    en: 'Answer alone, or leave you a draft',
  },
  comportamientoBajada: {
    es: 'Encendido quiere decir que participa. El segundo interruptor es el techo de lo que puede hacer: apagado, todo lo que escriba te queda como borrador para revisar antes de que salga. Se prende más adelante, cuando ya viste cómo contesta.',
    en: 'Enabled means it takes part. The second switch is the ceiling on what it may do: turned off, everything it writes waits as a draft for you to review before it goes out. You turn it on later, once you have seen how it answers.',
  },

  crearTitulo: { es: 'Creá el agente', en: 'Create the agent' },
  crearBajada: {
    es: 'Con el nombre alcanza para crearlo. El rol y las instrucciones se siguen corrigiendo todas las veces que haga falta, y cada cambio se prueba acá mismo.',
    en: 'The name alone is enough to create it. The role and the instructions can be fixed as many times as needed, and every change gets tested right here.',
  },
  accionCrear: { es: 'Tocá “Crear agente”.', en: 'Tap “Create agent”.' },

  probarTitulo: { es: 'Probalo antes de soltarlo', en: 'Try it before letting it loose' },
  probarBajada: {
    es: 'Es la misma llamada que la de un mensaje de verdad —mismo catálogo, mismo horario, mismo material—, con una diferencia: no escribe nada en ningún lado y no le llega a nadie. Y te dice algo que la conversación real no deja ver hasta que ya pasó: si esa respuesta salía sola o quedaba como borrador.',
    en: 'It is the same call a real message makes —same catalog, same hours, same material— with one difference: it writes nothing anywhere and reaches nobody. And it tells you something a real conversation only reveals once it is too late: whether that answer would have gone out on its own or waited as a draft.',
  },
  accionProbar: {
    es: 'Escribile como si fueras un cliente: “hola, están abiertos?”',
    en: 'Write to it as if you were a customer: “hi, are you open?”',
  },

  finalTitulo: { es: 'Ya tenés quien atienda', en: 'You have someone on the desk' },
  finalBajada: {
    es: 'Podés armar los que quieras y cada uno entra cuando le toca; el primero encendido atiende lo que no encaja en ninguno. Lo único que falta para que esto conteste de verdad es un canal conectado.',
    en: 'You can build as many as you like and each one steps in when its turn comes; the first one enabled takes whatever fits none of them. The only thing left for this to actually answer is a connected channel.',
  },
  finalConectar: { es: 'Conectar un canal', en: 'Connect a channel' },
}

export default {
  login: LOGIN,
  alta: ALTA,
  tourAgente: TOUR_AGENTE,
  barra: BARRA,
  errores: ERRORES,
  ui: UI,
  bienvenida: BIENVENIDA,
  tour: TOUR,
}
