// Copy de las doce páginas de producto. Vive aparte de ui.js porque cada
// página trae varias secciones y no vale inflar el archivo de la landing.

// `menu` es el renglón del mega menú de la barra: cuatro o cinco palabras.
// No es la `bajada` ni la `description` recortada — esas están escritas para
// leerse enteras, y en una columna del desplegable entran a dos renglones y
// obligan a leer para elegir. Acá alcanza con que descarte lo que no es.
function pagina({ nombre, menu, title, description, titulo, bajada, secciones, pasos, cierre }) {
  return { nombre, menu, title, description, titulo, bajada, secciones, pasos, cierre }
}

const columnasEs = {
  atencion: 'Atención',
  inteligencia: 'Inteligencia',
  operacion: 'Operación',
  plataforma: 'Plataforma',
}

const columnasEn = {
  atencion: 'Inbox',
  inteligencia: 'Intelligence',
  operacion: 'Operations',
  plataforma: 'Platform',
}

export const productoEs = {
  verTambien: 'En esta sección',
  enLaPractica: 'En la práctica',
  ctaTitulo: '¿Querés verlo con tus conversaciones?',
  ctaTexto: 'Una demo corta, con el catálogo y las preguntas que ya te llegan por WhatsApp.',
  ctaBoton: 'Pedir una demo',
  columnas: columnasEs,
  paginas: {
    bandeja: pagina({
      nombre: 'Bandeja única',
      menu: 'Todos los chats en un lugar',
      title: 'Bandeja única · conext',
      description:
        'Todas las conversaciones de WhatsApp de tu negocio en un solo lugar: pendientes, asignadas y con estado de entrega.',
      titulo: 'Todas las conversaciones, en un solo lugar.',
      bajada:
        'Se termina el “¿este ya lo contestó alguien?”. El WhatsApp del negocio deja de vivir en un teléfono y pasa a una bandeja que ve todo el equipo.',
      secciones: [
        {
          titulo: 'Un hilo por número, no por persona del local.',
          parrafos: [
            'La identidad de una conversación es el teléfono del contacto. Da igual quién abrió el chat: el hilo es el mismo, con el historial, el agente que lo está atendiendo y si quedó algo pendiente. No hay que pedir prestado el celular de la caja para retomar una venta.',
            'Los mensajes entran por la API oficial de WhatsApp Business. Cada uno queda con su estado de entrega —enviado, entregado, leído— y el CRM no deja que un acuse que llega tarde pise uno más nuevo.',
          ],
        },
        {
          titulo: 'Lo que hay que contestar, marcado.',
          parrafos: [
            'Si un mensaje quedó sin respuesta, la bandeja lo cuenta. Los agentes pueden dejar un borrador; vos lo mandás o lo editás. Lo que ya se resolvió no se mezcla con lo que todavía espera, así el turno que entra no tiene que adivinar por dónde empezar.',
            'WhatsApp da una ventana de 24 horas desde el último mensaje del cliente. El CRM la tiene presente: fuera de esa ventana no se finge que se puede escribir como si nada. Y si el día de trabajo está cerrado, tampoco se sale a mandar.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Llega el mensaje', texto: 'Meta lo firma, el CRM lo guarda una sola vez y actualiza el hilo de ese número.' },
        { titulo: 'Se ve en la bandeja', texto: 'Queda pendiente, asignado o en el agente que lo tomó. El resto del equipo lo ve igual.' },
        { titulo: 'Se responde desde acá', texto: 'Texto, adjunto o la sugerencia de la IA. El cliente recibe un WhatsApp normal, no un bot con menú.' },
      ],
      cierre:
        'La bandeja es el lugar de trabajo. Carpetas, notas y asignación viven adentro de ella, no en otra app.',
    }),
    carpetas: pagina({
      nombre: 'Carpetas y etiquetas',
      menu: 'Filtrar y encontrar un hilo',
      title: 'Carpetas y etiquetas · conext',
      description:
        'Filtrá la bandeja por mías, sin asignar o pendientes, y etiquetá cada conversación para encontrarla después.',
      titulo: 'Encontrar un chat sin recorrer toda la lista.',
      bajada:
        'La barra de la izquierda no es un adorno: son las mismas preguntas que te hacés en un turno —qué es mío, qué nadie tomó, qué sigue sin respuesta.',
      secciones: [
        {
          titulo: 'Carpetas que ya vienen con el trabajo.',
          parrafos: [
            'Todas, Mías, Sin asignar y Pendientes. No hay que armarlas: salen de quién tiene la conversación y de si todavía hay que contestar. El número al lado es cuántos hilos hay en esa carpeta ahora, no un total histórico que no ayuda a las tres de la tarde.',
            'Elegir una carpeta es siempre una pregunta sobre la bandeja. Si estás en Inicio o en Productos y tocás “Pendientes”, vas a la bandeja con ese filtro puesto. No se cambia de forma la columna al navegar.',
          ],
        },
        {
          titulo: 'Etiquetas en el contacto, no en un Excel.',
          parrafos: [
            'Cada hilo tiene un panel de contacto. Ahí se agregan y se sacan etiquetas —ventas, envío, mayorista— sin salir de la conversación. Sirven para marcar de qué se trata el chat cuando el nombre del cliente no alcanza.',
            'La asignación va en el mismo lugar: un responsable, o nadie. “Mías” y “Sin asignar” leen ese dato. No es un workflow de diez pasos; es quién lo está mirando hoy.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Abrís la carpeta', texto: 'Pendientes, mías o sin asignar. La lista se achica a lo que importa en este turno.' },
        { titulo: 'Entras al hilo', texto: 'El panel de la derecha muestra el contacto, el agente y las etiquetas que ya tiene.' },
        { titulo: 'Marcas o asignás', texto: 'Una etiqueta nueva o un responsable. La carpeta del resto del equipo se actualiza sola.' },
      ],
      cierre: 'Las carpetas ordenan el turno. Las etiquetas ordenan el tema. Las dos viven en la misma bandeja.',
    }),
    notas: pagina({
      nombre: 'Notas internas',
      menu: 'Contexto que el cliente no ve',
      title: 'Notas internas · conext',
      description:
        'Dejá contexto en el hilo para el equipo, sin que el cliente lo vea. El composer cambia de modo y no se mezcla con la respuesta.',
      titulo: 'Lo que el equipo tiene que saber, sin mandárselo al cliente.',
      bajada:
        '“Pidió factura A”, “no ofrecerle descuento”, “espera el pago de ayer”. Eso no es un WhatsApp. Es una nota en el hilo, visible para quien lo abra después.',
      secciones: [
        {
          titulo: 'El mismo cuadro, otro modo.',
          parrafos: [
            'En el composer hay un modo mensaje y un modo nota. La isla se tiñe cuando estás escribiendo para adentro, para que no se mande un recado interno al número del cliente. Atajo: Ctrl + \\. Enter guarda la nota; no la envía a WhatsApp.',
            'Si había una sugerencia de la IA y la usás, el cuadro vuelve a modo mensaje antes de bajar el texto. Si no, la respuesta al cliente terminaría guardada como nota y nadie la vería del otro lado.',
          ],
        },
        {
          titulo: 'Viven en el contacto, no en un chat aparte.',
          parrafos: [
            'El panel de la derecha tiene una pestaña de notas internas. Ahí está el historial de lo que el equipo fue dejando sobre esa persona. No hay que buscarlo en otro sistema ni en un sticker en la caja.',
            'Una nota es texto. No lleva foto ni nota de voz: eso es para el cliente. Mezclar un adjunto con una nota interna es exactamente cómo se le manda algo a la persona equivocada, así que el CRM no lo deja hacer.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Cambiás a nota', texto: 'El cuadro avisa que estás escribiendo para el equipo, no para WhatsApp.' },
        { titulo: 'Guardás', texto: 'Queda en el hilo y en la pestaña de notas del contacto. El cliente no recibe nada.' },
        { titulo: 'El siguiente turno la lee', texto: 'Abre el mismo chat y ve el contexto sin tener que preguntar por atrás.' },
      ],
      cierre: 'La nota es el recado que antes iba por el grupo de WhatsApp del local. Ahora está en el hilo correcto.',
    }),
    agentes: pagina({
      nombre: 'Agentes de IA',
      menu: 'Uno por tema, en español',
      title: 'Agentes de IA · conext',
      description:
        'Creá un agente por tema —ventas, envíos, posventa— con su rol e instrucciones en español. Sin programar.',
      titulo: 'Un agente por tema, escrito en tu idioma.',
      bajada:
        'No es un único chatbot con un árbol de opciones. Son varias personas virtuales, cada una con su rol, y el modelo elige cuál toma el mensaje.',
      secciones: [
        {
          titulo: 'Nombre, rol, instrucciones. Nada de código.',
          parrafos: [
            'Cada agente tiene un nombre que ves en la bandeja, un rol (quién es para el negocio) y las instrucciones que le escribís vos: tono, qué puede promete, qué no. Se prende y se apaga. Se reordenan. Se borran —siempre preguntando antes.',
            'El interruptor de envío automático es de cada agente, no de todo el CRM. El de ventas puede mandar solo el precio de lista; el de reclamos deja el texto para que lo mire una persona. Ese techo gana siempre: si está apagado, el modelo no sale a WhatsApp aunque se sienta seguro.',
          ],
        },
        {
          titulo: 'El modelo elige quién habla. Vos podés cambiarlo.',
          parrafos: [
            'Con cada mensaje entrante, Gemini elige el agente y redacta en el mismo paso. Si el contacto ya venía con uno, eso entra como contexto; si el modelo nombra uno que no existe, se queda el que ya atendía.',
            'En el hilo se puede cambiar el agente a mano. El panel muestra si está apagado. Entrar a un agente desde la barra abre su configuración, no un filtro más: es otra pantalla, con cuántas conversaciones está tomando.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Lo creás', texto: 'Nombre, rol e instrucciones. El envío automático, apagado al principio si todavía no lo conocés.' },
        { titulo: 'Atiende', texto: 'El modelo lo elige cuando el tema le calza, o lo asignás vos desde el chat.' },
        { titulo: 'Lo afinás', texto: 'Si se pasa de listo, bajás el techo a borrador. Si ya responde bien, lo dejás mandar solo.' },
      ],
      cierre: 'Los agentes no reemplazan al equipo. Reparte el trabajo que ya sabés cómo se responde.',
    }),
    borrador: pagina({
      nombre: 'Envío o borrador',
      menu: 'Manda solo o te deja el texto',
      title: 'Envío o borrador · conext',
      description:
        'Cada agente manda solo lo seguro o te deja el texto listo para revisar. El interruptor es por agente, no para todo el CRM.',
      titulo: 'La IA escribe. Vos decidís si se envía.',
      bajada:
        'Los temas que ya responde bien, que los atienda sola. Los que tocan un descuento, plata o un cliente enojado, que te esperen. Se cambia de opinión con un clic.',
      secciones: [
        {
          titulo: 'No basta con que el modelo se sienta seguro.',
          parrafos: [
            'Para que una respuesta salga sola tienen que cumplirse varias cosas a la vez: el mensaje se clasificó como automático, el modelo marcó que se puede enviar, el agente tiene el envío automático prendido, hay un día de trabajo abierto y estás dentro del horario. Si falta una, queda como borrador.',
            'Ese borrador vive en el hilo (`ai_draft`). Lo ves, lo editás y lo mandás. Si el envío a Meta falla, también queda ahí: no se pierde el texto ni se inventa que salió.',
          ],
        },
        {
          titulo: 'Lo que revisás es lo que vería el cliente.',
          parrafos: [
            'WhatsApp no es Markdown. La negrita va *así*, con un asterisco. El modelo tiende a escribir **así**; el CRM lo traduce antes de mostrar el borrador, no recién al enviar. Si se tradujera tarde, vos estarías aprobando un texto con asteriscos de más.',
            'Las primeras semanas el modo borrador es el camino. Cuando un agente ya responde bien un tema, le prendés el envío automático solo a ese y dejás el resto esperando.',
          ],
        },
      ],
      pasos: [
        { titulo: 'El mensaje entra', texto: 'Se clasifica y se redacta una respuesta en la misma llamada al modelo.' },
        { titulo: 'Se decide si sale', texto: 'Agente, categoría, horario y día abierto. Si algo no cierra, no se manda.' },
        { titulo: 'Vos lo ves o el cliente lo recibe', texto: 'Borrador en el hilo, o WhatsApp ya enviado. Nunca un limbo.' },
      ],
      cierre: 'El control no es un prompt escondido. Es un interruptor que ves en cada agente.',
    }),
    clasificacion: pagina({
      nombre: 'Clasificación',
      menu: 'Elige agente y redacta',
      title: 'Clasificación · conext',
      description:
        'Una sola llamada a Gemini elige agente, marca si es automático o pendiente, y redacta la respuesta con el catálogo a la vista.',
      titulo: 'Elegir agente, clasificar y redactar, en un paso.',
      bajada:
        'No hay un clasificador y después un redactor que espera. Una llamada, un esquema fijo, y el mensaje ya sabe quién lo atiende y si puede salir solo.',
      secciones: [
        {
          titulo: 'El modelo no inventa el formato de la respuesta.',
          parrafos: [
            'Gemini tiene que llamar a una función con agente, categoría (`automatico` o `pendiente`), si se puede autoenviar, y el texto. No hay un párrafo libre que después hay que parsear: si no calza, no hay clasificación.',
            'La categoría `automatico` es para lo que se resuelve con el catálogo y los horarios. `pendiente` es lo que pide criterio de una persona. El `canAutoSend` es más estricto: solo si la respuesta está completa y es segura. El interruptor del agente puede bajarlo a falso aunque el modelo haya dicho que sí.',
          ],
        },
        {
          titulo: 'El contexto es el de tu negocio, no uno genérico.',
          parrafos: [
            'El prompt lleva los productos con precio y stock, los horarios, los agentes y el hilo reciente. Por eso puede decir “sí, hay talle M” o “hoy cerramos a las 18” sin que le armes un árbol.',
            'Si el mismo mensaje de Meta llega dos veces —ellos reintentan si tardás—, el CRM lo ignora la segunda: el identificador del mensaje ya está. Y si escribís fuera de hora, primero va el aviso de ausencia, con un tope para no mandarlo cada cinco minutos.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Entra el texto', texto: 'Se arma el historial, el catálogo y la lista de agentes.' },
        { titulo: 'El modelo llena el esquema', texto: 'Agente, categoría, si se puede enviar, y la respuesta ya en formato WhatsApp.' },
        { titulo: 'El CRM aplica las reglas', texto: 'Día abierto, horario, techo del agente. Recién ahí sale o queda borrador.' },
      ],
      cierre: 'Clasificar no es una etiqueta para un reporte. Es la puerta que decide si alguien tiene que mirar.',
    }),
    catalogo: pagina({
      nombre: 'Catálogo y stock',
      menu: 'Precios y stock a la vista',
      title: 'Catálogo y stock · conext',
      description:
        'Los agentes responden precios y disponibilidad con tu catálogo. Precio, stock y carpetas, a la vista de la IA y del equipo.',
      titulo: 'Los agentes contestan con tus productos, no de memoria.',
      bajada:
        'Precio y stock van en el mismo lugar donde se atiende. La IA los tiene a la vista cuando redacta; vos los ves en la pantalla de productos y en el inicio si se están por acabar.',
      secciones: [
        {
          titulo: 'Un catálogo que se usa, no un PDF colgado.',
          parrafos: [
            'Cada producto tiene nombre, precio y stock. Se agrupan en carpetas para no tener una lista plana de cien ítems. Se busca, se edita, se borra —siempre pidiendo confirmación. El valor del inventario se calcula con lo que ya está cargado; no hay un número paralelo que se desactualiza.',
            'Ese mismo listado entra en la instrucción del modelo. Cuando el cliente pregunta “¿tenés el negro en M?”, la respuesta sale de acá, no de un prompt genérico que inventa talles.',
          ],
        },
        {
          titulo: 'El stock bajo se ve igual en todos lados.',
          parrafos: [
            'Cero unidades es “sin stock”. Diez o menos, “stock bajo”. El umbral es el mismo en Productos y en las alertas de Inicio: un ítem no puede estar crítico en una pantalla y normal en la otra.',
            'Los planes limitan cuántos productos entran en el catálogo. El gratis alcanza para probar; cuando el volumen crece, el techo sube. Lo que no cambia es que la IA y el equipo miran la misma lista.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Cargás el producto', texto: 'Nombre, precio, stock, carpeta. Es lo que el agente va a citar.' },
        { titulo: 'Llega la pregunta', texto: 'El modelo ve el catálogo junto con el mensaje y responde con esos números.' },
        { titulo: 'Actualizás el stock', texto: 'La próxima respuesta ya usa el dato nuevo. Las alertas de Inicio también.' },
      ],
      cierre: 'Si el catálogo está desactualizado, la IA va a decir lo que está desactualizado. Por eso vive en el CRM, no en una planilla aparte.',
    }),
    metricas: pagina({
      nombre: 'Métricas del día',
      menu: 'Cuánto respondió la IA',
      title: 'Métricas del día · conext',
      description:
        'El día de trabajo se abre y se cierra a mano. Ves cuánto respondió la IA, cuánto tardaste y qué quedó pendiente.',
      titulo: 'El día, medido. No el calendario.',
      bajada:
        'La unidad de trabajo no es la fecha: es el día que abrís vos. Sin día abierto no se envía ni se deja nota. Cuando lo cerrás, queda archivado para comparar.',
      secciones: [
        {
          titulo: 'Abrir y cerrar es una decisión, no un cron.',
          parrafos: [
            'Hay un solo día abierto por negocio. El alta del cliente abre el primero para que la bandeja no quede trabada. Cerrar guarda la hora; el siguiente turno abre uno nuevo. Los días cerrados se listan en la barra, con cuántos mensajes entraron.',
            'Sin día abierto no se manda nada ni se agregan notas. Es a propósito: el turno tiene un principio y un final, y las métricas se calculan sobre ese bloque, no sobre “hoy” según el reloj.',
          ],
        },
        {
          titulo: 'Los números salen de los mensajes, no de otro tablero.',
          parrafos: [
            'Mensajes del día, pendientes, porcentaje de automatización, tiempo hasta la primera respuesta, actividad hora a hora, cuánto llevó la IA y cuánto una persona. La variación se mide contra el último día cerrado. Si todavía no cerraste ninguno, no se inventa un “ayer”.',
            'Solo cuentan los entrantes como actividad del cliente. Un saliente es una respuesta nuestra. Los que nadie contestó no entran en el promedio de tiempo: son los pendientes, y se ven aparte.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Abrís el día', texto: 'La bandeja puede enviar. El pie de la barra lo dice, con la hora.' },
        { titulo: 'Atendés', texto: 'Los KPIs se arman con lo que entra y lo que sale. Nada se carga a mano.' },
        { titulo: 'Cerrás', texto: 'Queda archivado. El próximo se compara contra este, no contra un día del almanaque.' },
      ],
      cierre: 'Si el local cierra a las 20 y el sábado es feria, el día del CRM es ese turno —no las 24 horas del servidor.',
    }),
    stock: pagina({
      nombre: 'Alertas de stock',
      menu: 'Qué producto está en cero',
      title: 'Alertas de stock · conext',
      description:
        'El inicio te avisa qué productos están en cero o por debajo del umbral, con el mismo criterio que la pantalla de productos.',
      titulo: 'Enterarte antes de que el cliente pregunte y no haya.',
      bajada:
        'La IA responde con el stock que cargaste. Si ese número está mal o en cero, va a decir que no hay. Las alertas están para que lo veas vos primero.',
      secciones: [
        {
          titulo: 'El mismo umbral en Inicio y en Productos.',
          parrafos: [
            'Cero es sin stock, rojo. Diez unidades o menos es bajo, ámbar. No hay un criterio “más suave” en el inicio para no asustar: si está bajo, está bajo en las dos pantallas. La lista muestra las primeras alertas y un atajo a Productos.',
            'Abajo, el total de productos y el valor del inventario. Es la suma de precio por unidades de lo que ya está en el catálogo, no un objetivo de ventas.',
          ],
        },
        {
          titulo: 'Sirven porque la IA las usa también.',
          parrafos: [
            'Cuando el modelo arma una respuesta, mira ese stock. Una alerta que ignorás es un “sí, hay” que ya no es cierto. Actualizar el número es lo que corrige las dos cosas a la vez: lo que ves vos y lo que se le dice al cliente.',
            'No es un sistema de reposición ni un ERP. Es el recorte que un mostrador necesita: qué se acaba, qué ya no está, y un click para ir a corregirlo.',
          ],
        },
      ],
      pasos: [
        { titulo: 'El stock baja', texto: 'En Productos queda marcado. En Inicio aparece en alertas, con el mismo color.' },
        { titulo: 'Lo ves al entrar', texto: 'No hay que abrir el catálogo para enterarte. Las primeras cinco están en la home.' },
        { titulo: 'Lo actualizás', texto: 'La alerta se cae. La próxima respuesta de un agente ya usa el número nuevo.' },
      ],
      cierre: 'La alerta no reemplaza al que compra mercadería. Evita que el CRM venda lo que la góndola ya no tiene.',
    }),
    'api-whatsapp': pagina({
      nombre: 'API de WhatsApp',
      menu: 'La Cloud API oficial de Meta',
      title: 'API oficial de WhatsApp · conext',
      description:
        'conext se conecta por la Cloud API de Meta. El número es tuyo, la cuenta también. Sin clonar la sesión ni dejar un teléfono enchufado.',
      titulo: 'Automatizar WhatsApp sin arriesgar el número.',
      bajada:
        'Las herramientas que se cuelgan de la app del teléfono funcionan hasta que Meta las detecta. Esta es la puerta que Meta abre para esto.',
      secciones: [
        {
          titulo: 'Tu número, tu cuenta de Meta.',
          parrafos: [
            'Se enlaza el WhatsApp Business con tu propia cuenta. El número es tuyo: si un día te vas, te lo llevás. No hay que clonar una sesión ni dejar un celular en un cajón conectado al cargador.',
            'Un número en la API no puede estar al mismo tiempo en la app de WhatsApp del teléfono. Si hoy lo atendés a mano y no querés cortar eso todavía, se empieza con un número aparte y se pasa el principal cuando te sientas cómodo.',
          ],
        },
        {
          titulo: 'Meta firma. El CRM no improvisa.',
          parrafos: [
            'El webhook lo firma Meta. Si el payload no corresponde a un número nuestro, se descarta. El CRM responde 200 de inmediato y procesa después: si tardara, Meta reintenta y el mismo mensaje se duplicaría. El identificador del mensaje evita que se procese dos veces.',
            'Hoy el canal que trabaja es WhatsApp de texto. Instagram está declarado y dormido. Los adjuntos salientes sí: se suben a Graph y después se mandan; la copia que queda en el hilo es la nuestra, porque Meta borra la suya a los 30 días. Los adjuntos que manda el cliente todavía no se bajan.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Conectás el número', texto: 'Cuenta de Meta, token, phone_number_id. Queda cifrado en tu espacio, no en un .env compartido.' },
        { titulo: 'Llegan los eventos', texto: 'Meta firma, el CRM resuelve el negocio por el número y corre el pipeline.' },
        { titulo: 'Salen las respuestas', texto: 'Texto o media por Graph. Si no hay credenciales, en desarrollo se simula; en producción no hay magia.' },
      ],
      cierre:
        'Meta cobra las conversaciones a tu cuenta, con su tarifa. conext no le agrega un margen encima. Lo que se paga acá es el software.',
    }),
    equipo: pagina({
      nombre: 'Equipo en un número',
      menu: 'Varias personas, un número',
      title: 'Equipo en un número · conext',
      description:
        'Varias personas atienden el mismo WhatsApp, cada una con su usuario. Asignación, roles y una bandeja compartida.',
      titulo: 'Varias personas, un número. Nadie pide el teléfono.',
      bajada:
        'El equipo y los agentes trabajan sobre la misma bandeja. Cada quien entra con su usuario. El WhatsApp del local deja de ser un aparato que se presta.',
      secciones: [
        {
          titulo: 'Un negocio, varios miembros.',
          parrafos: [
            'Las personas no son el cliente de conext: se unen a un negocio con un rol —dueño, admin u operador. Ven solo los negocios de los que son miembros. El teléfono de WhatsApp sigue siendo uno; lo que se multiplica son las manos que lo atienden.',
            'Asignar un hilo a alguien es lo que llena la carpeta “Mías” y vacía “Sin asignar”. El resto ve quién lo tiene. No hace falta un grupo de WhatsApp paralelo para decir “esto lo toma Ana”.',
          ],
        },
        {
          titulo: 'Los agentes cuentan como manos más, no como otro número.',
          parrafos: [
            'Un agente atiende en el mismo hilo que una persona. Queda registrado quién contestó cada cosa —modelo o humano— para poder revisar después. El cliente recibe un WhatsApp del negocio, sin un cartel de “sos un bot”, y adentro sí se sabe.',
            'Los planes miden asientos: cuántas personas entran. El gratis es para probar; estándar y premium suman equipo. Un asiento extra se agrega cuando el turno ya no entra en los que vinieron.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Entra cada persona', texto: 'Miembro del negocio, con un rol. Ve la bandeja de ese número, no la de otro cliente de conext.' },
        { titulo: 'Se asignan los hilos', texto: 'Mías, sin asignar, pendientes. El trabajo del turno se parte sin pasar el celular.' },
        { titulo: 'Se revisa quién contestó', texto: 'Agente o persona, en el mismo historial. Sirve para afinar instrucciones, no para vigilar.' },
      ],
      cierre: 'El número es del negocio. Las personas rotan. La bandeja no tendría que rotar con ellas.',
    }),
    datos: pagina({
      nombre: 'Datos cifrados',
      menu: 'Cada negocio, su espacio',
      title: 'Datos cifrados · conext',
      description:
        'Cada negocio tiene su espacio. Los tokens de WhatsApp van cifrados y las conversaciones no se mezclan con las de otro cliente.',
      titulo: 'Tus datos son tuyos. Y están apartados de los del resto.',
      bajada:
        'Cada negocio es un espacio. Un token de WhatsApp no puede quedar en claro en una base que alguien volcó. Si te querés ir, se borra.',
      secciones: [
        {
          titulo: 'Nada se consulta “sin cliente”.',
          parrafos: [
            'Todo dato lleva el negocio adelante. Las consultas del CRM no tienen una variante global: si no hay negocio, no hay fila. Eso es lo que evita que un mensaje de uno aparezca en la bandeja de otro. Hay una verificación pensada solo para eso, y se corre cuando se toca una consulta.',
            'Las personas del dashboard ven, por reglas de la base, solo los negocios de los que son miembros. El webhook de Meta no trae sesión de nadie: entra por el número y se resuelve el negocio por ahí, no por un usuario logueado.',
          ],
        },
        {
          titulo: 'Los secretos no se guardan en claro.',
          parrafos: [
            'El token de WhatsApp de cada cliente se cifra con AES-256-GCM antes de ir a la base. Un volcado no alcanza para mandar mensajes en nombre de otro. Las API keys se hashean: se puede buscar el negocio por la clave que llega, pero no reconstruirla.',
            'No vendemos datos ni se los pasamos a nadie. En el pie están la política de privacidad y cómo pedir la eliminación. Si te vas, se borra el espacio de ese negocio —conversaciones, catálogo, agentes, credenciales.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Entra un dato', texto: 'Siempre atado a un negocio. El webhook resuelve cuál por el número de Meta.' },
        { titulo: 'Se guarda', texto: 'Conversaciones en su espacio. Tokens cifrados. Claves hasheadas.' },
        { titulo: 'Se puede borrar', texto: 'El pedido de eliminación está publicado. No hay un archivo nuestro con tu bandeja “por las dudas”.' },
      ],
      cierre: 'Aislamiento no es un sello de marketing. Es la primera columna de cada tabla y el primer argumento de cada función.',
    }),
  },
}

export const productoEn = {
  verTambien: 'In this section',
  enLaPractica: 'In practice',
  ctaTitulo: 'Want to see it with your own threads?',
  ctaTexto: 'A short demo, with the catalog and the questions you already get on WhatsApp.',
  ctaBoton: 'Request a demo',
  columnas: columnasEn,
  paginas: {
    bandeja: pagina({
      nombre: 'One inbox',
      menu: 'Every chat in one place',
      title: 'One inbox · conext',
      description:
        'Every WhatsApp conversation for the business in one place: pending, assigned, with delivery status.',
      titulo: 'Every conversation, in one place.',
      bajada:
        'No more “did someone already reply to this?”. The business WhatsApp stops living on a phone and becomes an inbox the whole team can see.',
      secciones: [
        {
          titulo: 'One thread per number, not per person at the shop.',
          parrafos: [
            'A conversation is identified by the contact’s phone. It does not matter who opened the chat: the thread is the same, with the history, the agent on it, and whether something is still pending. Nobody has to borrow the till phone to pick up a sale.',
            'Messages come in through the official WhatsApp Business API. Each one keeps its delivery status —sent, delivered, read— and the CRM will not let a late receipt overwrite a newer one.',
          ],
        },
        {
          titulo: 'What still needs a reply is marked.',
          parrafos: [
            'If a message has no reply, the inbox counts it. Agents can leave a draft; you send it or you edit it. What is already resolved is not mixed with what is waiting, so the next shift does not have to guess where to start.',
            'WhatsApp gives a 24-hour window from the customer’s last message. The CRM knows that: outside the window it does not pretend you can write as usual. And if the work day is closed, nothing goes out.',
          ],
        },
      ],
      pasos: [
        { titulo: 'The message arrives', texto: 'Meta signs it, the CRM stores it once, and the thread for that number updates.' },
        { titulo: 'It shows in the inbox', texto: 'Pending, assigned, or on the agent that took it. The rest of the team sees the same thing.' },
        { titulo: 'You reply from here', texto: 'Text, an attachment, or the AI suggestion. The customer gets a normal WhatsApp, not a menu bot.' },
      ],
      cierre: 'The inbox is the workplace. Folders, notes, and assignment live inside it, not in another app.',
    }),
    carpetas: pagina({
      nombre: 'Folders and tags',
      menu: 'Filter and find a thread',
      title: 'Folders and tags · conext',
      description:
        'Filter the inbox by yours, unassigned, or pending, and tag each conversation so you can find it later.',
      titulo: 'Find a chat without scrolling the whole list.',
      bajada:
        'The left bar is not decoration. It is the questions you ask on a shift —what is mine, what nobody took, what still needs a reply.',
      secciones: [
        {
          titulo: 'Folders that come with the work.',
          parrafos: [
            'All, Mine, Unassigned, and Pending. You do not build them: they come from who owns the conversation and whether it still needs a reply. The number next to each one is how many threads are in that folder now, not a lifetime total that does not help at 3 p.m.',
            'Picking a folder is always a question about the inbox. If you are on Home or Products and you tap Pending, you land in the inbox with that filter on. The column does not change shape as you move around the app.',
          ],
        },
        {
          titulo: 'Tags on the contact, not in a spreadsheet.',
          parrafos: [
            'Each thread has a contact panel. You add and remove tags there —sales, shipping, wholesale— without leaving the conversation. They mark what the chat is about when the customer’s name is not enough.',
            'Assignment lives in the same place: someone responsible, or no one. Mine and Unassigned read that field. It is not a ten-step workflow; it is who is looking at it today.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You open the folder', texto: 'Pending, mine, or unassigned. The list shrinks to what this shift needs.' },
        { titulo: 'You open the thread', texto: 'The right-hand panel shows the contact, the agent, and the tags it already has.' },
        { titulo: 'You tag or assign', texto: 'A new tag or a person. Everyone else’s folder updates on its own.' },
      ],
      cierre: 'Folders sort the shift. Tags sort the topic. Both live in the same inbox.',
    }),
    notas: pagina({
      nombre: 'Internal notes',
      menu: 'Notes only your team sees',
      title: 'Internal notes · conext',
      description:
        'Leave context on the thread for the team, without the customer seeing it. The composer changes mode so it cannot mix with a reply.',
      titulo: 'What the team needs to know, without sending it to the customer.',
      bajada:
        '“They asked for an invoice”, “don’t offer a discount”, “waiting on yesterday’s payment”. That is not a WhatsApp. It is a note on the thread, visible to whoever opens it next.',
      secciones: [
        {
          titulo: 'The same box, another mode.',
          parrafos: [
            'The composer has a message mode and a note mode. The island tints when you are writing for the inside, so an internal remark does not go out to the customer’s number. Shortcut: Ctrl + \\. Enter saves the note; it does not send it to WhatsApp.',
            'If you use an AI suggestion, the box switches back to message mode before the text drops in. Otherwise the reply to the customer would be saved as a note and nobody on the other side would see it.',
          ],
        },
        {
          titulo: 'They live on the contact, not in a side chat.',
          parrafos: [
            'The right-hand panel has an internal notes tab. That is the history of what the team left on that person. You do not hunt for it in another system or on a sticky note at the till.',
            'A note is text. It does not take a photo or a voice note: those are for the customer. Mixing an attachment with an internal note is exactly how something goes to the wrong person, so the CRM will not let you.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You switch to note', texto: 'The box makes it clear you are writing for the team, not for WhatsApp.' },
        { titulo: 'You save', texto: 'It stays on the thread and on the contact’s notes tab. The customer gets nothing.' },
        { titulo: 'The next shift reads it', texto: 'They open the same chat and see the context without asking around the back.' },
      ],
      cierre: 'The note is the remark that used to go in the shop’s WhatsApp group. Now it sits on the right thread.',
    }),
    agentes: pagina({
      nombre: 'AI agents',
      menu: 'One per topic, plain language',
      title: 'AI agents · conext',
      description:
        'Create an agent per topic —sales, shipping, after-sales— with its role and instructions in plain language. No coding.',
      titulo: 'One agent per topic, written in your language.',
      bajada:
        'It is not a single chatbot with a tree of options. It is several virtual people, each with a role, and the model picks which one takes the message.',
      secciones: [
        {
          titulo: 'Name, role, instructions. No code.',
          parrafos: [
            'Each agent has a name you see in the inbox, a role (who they are for the business), and the instructions you write: tone, what they may promise, what they may not. You turn them on and off. You reorder them. You delete them —always after a confirmation.',
            'The auto-send switch belongs to each agent, not to the whole CRM. Sales can send list prices on their own; complaints leave the text for a person to look at. That ceiling always wins: if it is off, the model does not go out to WhatsApp even if it feels sure.',
          ],
        },
        {
          titulo: 'The model picks who speaks. You can change it.',
          parrafos: [
            'On every inbound message, Gemini picks the agent and writes the reply in the same step. If the contact already had one, that is context; if the model names one that does not exist, the one already on the thread stays.',
            'You can change the agent by hand in the thread. The panel shows if it is off. Opening an agent from the bar opens its settings, not another filter: it is a different screen, with how many conversations it is handling.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You create it', texto: 'Name, role, and instructions. Auto-send off at first if you do not know it yet.' },
        { titulo: 'It handles the chat', texto: 'The model picks it when the topic fits, or you assign it from the thread.' },
        { titulo: 'You tune it', texto: 'If it gets ahead of itself, you drop it to draft. If it already replies well, you let it send.' },
      ],
      cierre: 'Agents do not replace the team. They take the work you already know how to answer.',
    }),
    borrador: pagina({
      nombre: 'Auto-send or draft',
      menu: 'Sends on its own, or waits',
      title: 'Auto-send or draft · conext',
      description:
        'Each agent sends what is safe on its own, or leaves the text for you to review. The switch is per agent, not for the whole CRM.',
      titulo: 'AI writes. You decide if it sends.',
      bajada:
        'Topics it already handles well can go out on their own. Anything that touches a discount, money, or an angry customer waits for you. You change your mind with one click.',
      secciones: [
        {
          titulo: 'The model feeling sure is not enough.',
          parrafos: [
            'For a reply to go out on its own, several things have to be true at once: the message was classified as automatic, the model marked it safe to send, the agent has auto-send on, a work day is open, and you are inside business hours. If one is missing, it stays a draft.',
            'That draft lives on the thread. You see it, you edit it, you send it. If the send to Meta fails, it stays there too: the text is not lost and the CRM does not pretend it went out.',
          ],
        },
        {
          titulo: 'What you review is what the customer would see.',
          parrafos: [
            'WhatsApp is not Markdown. Bold is *this*, with one asterisk. Models tend to write **this**; the CRM translates before showing the draft, not only when sending. Translate too late and you would be approving extra asterisks.',
            'Draft mode is the way to start for the first weeks. When an agent already handles a topic well, you turn auto-send on for that one only and leave the rest waiting.',
          ],
        },
      ],
      pasos: [
        { titulo: 'The message comes in', texto: 'It is classified and a reply is drafted in the same model call.' },
        { titulo: 'The CRM decides if it goes out', texto: 'Agent, category, hours, and an open day. If something does not fit, it does not send.' },
        { titulo: 'You see it, or the customer does', texto: 'A draft on the thread, or a WhatsApp already sent. Never a limbo.' },
      ],
      cierre: 'Control is not a hidden prompt. It is a switch you see on every agent.',
    }),
    clasificacion: pagina({
      nombre: 'Classification',
      menu: 'Picks the agent and writes',
      title: 'Classification · conext',
      description:
        'A single Gemini call picks the agent, marks automatic or pending, and writes the reply with your catalog in view.',
      titulo: 'Pick an agent, classify, and write — in one step.',
      bajada:
        'There is no classifier and then a writer waiting on it. One call, a fixed schema, and the message already knows who owns it and whether it can go out alone.',
      secciones: [
        {
          titulo: 'The model does not invent the shape of the answer.',
          parrafos: [
            'Gemini has to call a function with the agent, the category (`automatico` or `pendiente`), whether it can auto-send, and the text. There is no free paragraph to parse afterwards: if it does not fit, there is no classification.',
            '`automatico` is for what the catalog and the hours can resolve. `pendiente` is what needs a person’s judgment. `canAutoSend` is stricter: only if the reply is complete and safe. The agent’s switch can force it to false even if the model said yes.',
          ],
        },
        {
          titulo: 'The context is your business, not a generic one.',
          parrafos: [
            'The prompt carries products with price and stock, hours, agents, and the recent thread. That is why it can say “yes, we have size M” or “we close at 6 today” without a tree you had to build.',
            'If the same Meta message arrives twice —they retry if you are slow— the CRM ignores the second: the message id is already there. And if they write after hours, the away notice goes first, with a cap so it is not sent every five minutes.',
          ],
        },
      ],
      pasos: [
        { titulo: 'The text comes in', texto: 'History, catalog, and the list of agents are assembled.' },
        { titulo: 'The model fills the schema', texto: 'Agent, category, whether it can send, and the reply already in WhatsApp format.' },
        { titulo: 'The CRM applies the rules', texto: 'Open day, hours, the agent’s ceiling. Only then it sends or stays a draft.' },
      ],
      cierre: 'Classification is not a label for a report. It is the door that decides whether a person has to look.',
    }),
    catalogo: pagina({
      nombre: 'Catalog and stock',
      menu: 'Prices and stock in view',
      title: 'Catalog and stock · conext',
      description:
        'Agents answer prices and availability from your catalog. Price, stock, and folders, in view for the AI and the team.',
      titulo: 'Agents answer with your products, not from memory.',
      bajada:
        'Price and stock live where you handle the chat. The AI has them in view when it writes; you see them on the products screen and on Home if they are about to run out.',
      secciones: [
        {
          titulo: 'A catalog that gets used, not a PDF on the side.',
          parrafos: [
            'Each product has a name, a price, and stock. They group into folders so you are not staring at a flat list of a hundred items. You search, edit, delete —always after a confirmation. Inventory value is computed from what is already loaded; there is no parallel number that goes stale.',
            'That same list goes into the model’s instruction. When a customer asks “do you have the black one in M?”, the answer comes from here, not from a generic prompt that invents sizes.',
          ],
        },
        {
          titulo: 'Low stock looks the same everywhere.',
          parrafos: [
            'Zero units is out of stock. Ten or fewer is low. The threshold is the same in Products and in the Home alerts: an item cannot be critical on one screen and fine on the other.',
            'Plans cap how many products fit in the catalog. Free is enough to try; as volume grows, the ceiling goes up. What does not change is that the AI and the team look at the same list.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You add the product', texto: 'Name, price, stock, folder. That is what the agent will quote.' },
        { titulo: 'The question arrives', texto: 'The model sees the catalog with the message and answers with those numbers.' },
        { titulo: 'You update stock', texto: 'The next reply already uses the new figure. So do the Home alerts.' },
      ],
      cierre: 'If the catalog is stale, the AI will say the stale thing. That is why it lives in the CRM, not in a separate sheet.',
    }),
    metricas: pagina({
      nombre: 'Day metrics',
      menu: 'How much the AI answered',
      title: 'Day metrics · conext',
      description:
        'The work day is opened and closed by hand. You see how much the AI answered, how long you took, and what is still pending.',
      titulo: 'The day, measured. Not the calendar.',
      bajada:
        'The unit of work is not the date: it is the day you open. With no open day you cannot send or leave a note. When you close it, it is archived so you can compare.',
      secciones: [
        {
          titulo: 'Opening and closing is a decision, not a cron job.',
          parrafos: [
            'There is one open day per business. Provisioning opens the first so the inbox is not stuck on closed. Closing stores the time; the next shift opens a new one. Closed days sit in the bar, with how many messages came in.',
            'With no open day, nothing sends and no notes are added. That is on purpose: the shift has a start and an end, and the metrics are computed on that block, not on “today” according to the clock.',
          ],
        },
        {
          titulo: 'The numbers come from the messages, not another dashboard.',
          parrafos: [
            'Messages in the day, pending, automation percentage, time to first reply, activity by hour, how much the AI took and how much a person did. Change is measured against the last closed day. If you have not closed one yet, it does not invent a “yesterday”.',
            'Only inbound messages count as customer activity. An outbound one is our reply. Unanswered inbound messages do not go into the average time: they are the pending ones, and they show separately.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You open the day', texto: 'The inbox can send. The bar footer says so, with the time.' },
        { titulo: 'You handle it', texto: 'KPIs are built from what comes in and what goes out. Nothing is typed in by hand.' },
        { titulo: 'You close it', texto: 'It is archived. The next one is compared against this, not against a calendar day.' },
      ],
      cierre: 'If the shop closes at 8 and Saturday is a fair, the CRM day is that shift —not the server’s 24 hours.',
    }),
    stock: pagina({
      nombre: 'Stock alerts',
      menu: 'Which product hit zero',
      title: 'Stock alerts · conext',
      description:
        'Home tells you which products are at zero or under the threshold, with the same rule as the products screen.',
      titulo: 'Know before the customer asks and there is none.',
      bajada:
        'The AI answers with the stock you loaded. If that number is wrong or zero, it will say there is none. Alerts are there so you see it first.',
      secciones: [
        {
          titulo: 'The same threshold on Home and in Products.',
          parrafos: [
            'Zero is out of stock, red. Ten units or fewer is low, amber. There is no gentler rule on Home so it does not scare you: if it is low, it is low on both screens. The list shows the first alerts and a shortcut to Products.',
            'Underneath, the product count and inventory value. That is price times units of what is already in the catalog, not a sales target.',
          ],
        },
        {
          titulo: 'They matter because the AI uses them too.',
          parrafos: [
            'When the model writes a reply, it looks at that stock. An alert you ignore is a “yes, we have it” that is no longer true. Updating the number fixes both at once: what you see and what the customer is told.',
            'It is not a replenishment system or an ERP. It is the slice a counter needs: what is running out, what is gone, and a click to go fix it.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Stock drops', texto: 'Products marks it. Home shows it in alerts, in the same color.' },
        { titulo: 'You see it when you come in', texto: 'You do not have to open the catalog to find out. The first five sit on Home.' },
        { titulo: 'You update it', texto: 'The alert goes away. The next agent reply already uses the new number.' },
      ],
      cierre: 'The alert does not replace the person who buys stock. It stops the CRM selling what the shelf no longer has.',
    }),
    'api-whatsapp': pagina({
      nombre: 'WhatsApp API',
      menu: 'Meta’s official Cloud API',
      title: 'Official WhatsApp API · conext',
      description:
        'conext connects through Meta’s Cloud API. The number is yours, the account too. No cloned session, no phone left on a charger.',
      titulo: 'Automate WhatsApp without putting the number at risk.',
      bajada:
        'Tools that hitch a ride on the phone app work until Meta catches them. This is the door Meta opens for this.',
      secciones: [
        {
          titulo: 'Your number, your Meta account.',
          parrafos: [
            'WhatsApp Business is linked to your own account. The number is yours: if you leave one day, you take it with you. No cloned session, no phone left in a drawer on a charger.',
            'A number on the API cannot also be in the WhatsApp app on a phone. If you handle it by hand today and you are not ready to cut that yet, you start with a spare number and move the main one when you are comfortable.',
          ],
        },
        {
          titulo: 'Meta signs. The CRM does not improvise.',
          parrafos: [
            'The webhook is signed by Meta. If the payload is not one of our numbers, it is dropped. The CRM answers 200 immediately and processes after: if it were slow, Meta would retry and the same message would duplicate. The message id stops it from being processed twice.',
            'The channel that works today is WhatsApp text. Instagram is declared and asleep. Outbound attachments do work: they upload to Graph and then send; the copy that stays in the thread is ours, because Meta deletes theirs after 30 days. Inbound customer media is not downloaded yet.',
          ],
        },
      ],
      pasos: [
        { titulo: 'You connect the number', texto: 'Meta account, token, phone_number_id. It is stored encrypted in your space, not in a shared env file.' },
        { titulo: 'Events arrive', texto: 'Meta signs, the CRM resolves the business by the number, and the pipeline runs.' },
        { titulo: 'Replies go out', texto: 'Text or media through Graph. Without credentials, development simulates; production does not pretend.' },
      ],
      cierre:
        'Meta charges for conversations on your Meta account, at their rate. conext does not add a markup. What you pay here is the software.',
    }),
    equipo: pagina({
      nombre: 'Team on one number',
      menu: 'Several people, one number',
      title: 'Team on one number · conext',
      description:
        'Several people handle the same WhatsApp, each with their own user. Assignment, roles, and a shared inbox.',
      titulo: 'Several people, one number. Nobody borrows the phone.',
      bajada:
        'The team and the agents work from the same inbox. Each person comes in with their user. The shop WhatsApp stops being a device you lend out.',
      secciones: [
        {
          titulo: 'One business, several members.',
          parrafos: [
            'People are not the conext customer: they join a business with a role —owner, admin, or operator. They only see the businesses they belong to. The WhatsApp number stays one; what multiplies is the hands that handle it.',
            'Assigning a thread to someone is what fills Mine and empties Unassigned. Everyone else sees who has it. You do not need a side WhatsApp group to say “Ana is taking this”.',
          ],
        },
        {
          titulo: 'Agents count as extra hands, not as another number.',
          parrafos: [
            'An agent works on the same thread as a person. Who answered each one is logged —model or human— so you can review later. The customer gets a WhatsApp from the business, with no “you are talking to a bot” banner, and on the inside you do know.',
            'Plans measure seats: how many people fit. Free is to try; Standard and Premium add team. An extra seat is added when the shift no longer fits in the ones that came with the plan.',
          ],
        },
      ],
      pasos: [
        { titulo: 'Each person comes in', texto: 'A member of the business, with a role. They see that number’s inbox, not another conext customer’s.' },
        { titulo: 'Threads get assigned', texto: 'Mine, unassigned, pending. The shift’s work splits without passing the phone.' },
        { titulo: 'You can see who replied', texto: 'Agent or person, in the same history. It is there to tune instructions, not to watch people.' },
      ],
      cierre: 'The number belongs to the business. People rotate. The inbox should not have to rotate with them.',
    }),
    datos: pagina({
      nombre: 'Encrypted data',
      menu: 'Each business, its own space',
      title: 'Encrypted data · conext',
      description:
        'Each business has its own space. WhatsApp tokens are encrypted, and conversations are not mixed with another customer’s.',
      titulo: 'Your data is yours. And it is kept apart from everyone else’s.',
      bajada:
        'Each business is a space. A WhatsApp token cannot sit in the clear in a dumped database. If you want to leave, it is deleted.',
      secciones: [
        {
          titulo: 'Nothing is queried “without a customer”.',
          parrafos: [
            'Every row carries the business first. CRM queries have no global variant: no business, no row. That is what stops one person’s message from showing up in another’s inbox. There is a check built only for that, and it runs when a query is touched.',
            'People in the dashboard see, by database rules, only the businesses they belong to. Meta’s webhook has no one’s session: it comes in by number and the business is resolved from that, not from a logged-in user.',
          ],
        },
        {
          titulo: 'Secrets are not stored in the clear.',
          parrafos: [
            'Each customer’s WhatsApp token is encrypted with AES-256-GCM before it hits the database. A dump is not enough to send messages as someone else. API keys are hashed: you can look up the business by the key that arrives, but you cannot rebuild it.',
            'We do not sell data or pass it on. The footer has the privacy policy and how to request deletion. If you leave, that business’s space is deleted —conversations, catalog, agents, credentials.',
          ],
        },
      ],
      pasos: [
        { titulo: 'A piece of data comes in', texto: 'Always tied to a business. The webhook resolves which one from Meta’s number.' },
        { titulo: 'It is stored', texto: 'Conversations in their space. Tokens encrypted. Keys hashed.' },
        { titulo: 'It can be deleted', texto: 'The deletion request is published. There is no file of ours with your inbox “just in case”.' },
      ],
      cierre: 'Isolation is not a marketing seal. It is the first column of every table and the first argument of every function.',
    }),
  },
}
