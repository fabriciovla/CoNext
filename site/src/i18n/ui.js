import { compararEn, compararEs } from './comparar.js'
import { docsEn, docsEs } from './docs.js'
import { integracionesEn, integracionesEs } from './integraciones.js'
import { productoEn, productoEs } from './producto.js'

export const ui = {
  es: {
    htmlLang: 'es',
    ogLocale: 'es_LA',
    ogImageAlt: 'El isotipo de conext',
    nav: {
      producto: 'Producto',
      funciones: 'Funciones',
      funcionesBajada: 'Qué hace el CRM con cada mensaje',
      comoFunciona: 'Cómo funciona',
      comoFuncionaBajada: 'Del primer mensaje a la respuesta',
      precios: 'Precios',
      clientes: 'Clientes',
      recursos: 'Recursos',
      preguntas: 'Preguntas',
      preguntasBajada: 'Lo que se pregunta antes de contratar',
      ayuda: 'Ayuda',
      ayudaBajada: 'Puesta en marcha y uso diario',
      githubBajada: 'El código del proyecto',
      docs: 'Documentación',
      docsBajada: 'Conectar canales y configurar la IA',
      integraciones: 'Integraciones',
      integracionesBajada: 'WhatsApp, Instagram y los eventos de Meta',
      comparar: 'Comparar',
      compararBajada: 'Conext frente a Respond.io, Wati y Manychat',
      iniciarSesion: 'Iniciar sesión',
      verPrecios: 'Ver precios',
      empezarGratis: 'Empezar gratis',
      abrirMenu: 'Abrir menú',
      cerrarMenu: 'Cerrar menú',
      megaAtencion: 'Atención',
      megaInteligencia: 'Inteligencia',
      megaOperacion: 'Operación',
      megaPlataforma: 'Plataforma',
      // La tarjeta del costado del mega menú y la franja de abajo. Son lo que
      // le da un piso al panel: doce enlaces sueltos son un mapa del sitio.
      megaDestacadoRotulo: 'Prueba',
      megaDestacadoTitulo: 'Probalo con tus conversaciones',
      megaDestacadoTexto: 'Siete días del Estándar completo, con tu catálogo y los tres canales.',
      megaDestacadoCta: 'Empezar gratis',
      megaPie: 'Todo corre sobre la API oficial de WhatsApp Business.',
      megaPieCta: 'Ver planes y precios',
    },
    footer: {
      nav: 'Pie de página',
      idioma: 'Idioma',
      copyright: 'Todos los derechos reservados.',
      meta: 'WhatsApp es una marca registrada de Meta Platforms, Inc.',
      columnas: {
        producto: 'Producto',
        atencion: 'Atención',
        inteligencia: 'Inteligencia',
        operacion: 'Operación',
        recursos: 'Recursos',
        general: 'General',
        llm: 'Recursos LLM',
        comparar: 'Comparar',
        integraciones: 'Integraciones',
        docs: 'Documentación',
      },
      links: {
        funciones: 'Funciones',
        comoFunciona: 'Cómo funciona',
        garantias: 'Garantías',
        bandeja: 'Una sola bandeja',
        horarios: 'Horarios de atención',
        agentes: 'Agentes de IA',
        automatico: 'Automático o borrador',
        productos: 'Productos y stock',
        dia: 'El día, medido',
        preguntas: 'Preguntas',
        ayuda: 'Centro de ayuda',
        facturacion: 'Facturación',
        cuentas: 'Cuentas',
        seguridad: 'Seguridad',
        datos: 'Datos',
        precios: 'Precios',
        docs: 'Documentación',
        integraciones: 'Integraciones',
        comparar: 'Comparar',
        login: 'Iniciar sesión',
        legalesAyuda: 'Ayuda',
        privacidad: 'Privacidad',
        terminos: 'Términos',
        eliminar: 'Eliminación de datos',
        llms: 'Leer llms.txt',
      },
    },
    landing: {
      title: 'conext · unifica tus canales. Cada respuesta, con IA',
      description:
        'Atiende el WhatsApp de tu negocio con agentes de IA que responden solos o te dejan el borrador listo. Bandeja única, productos, horarios y métricas.',
      anuncio: 'El CRM sobre la API oficial de Meta',
      heroLineas: ['Tus canales, en una sola bandeja.', 'Conext.'],
      heroBajada:
        'Los agentes de IA responden precios, stock y envíos con los datos de tu negocio, o te dejan el borrador. Si el cliente cambia de canal, el hilo sigue. La última palabra es tuya.',
      heroCta: 'Postulate',
      verComo: 'Ver cómo funciona',
      heroMarcas: ['WhatsApp, Instagram y Messenger', 'API oficial de Meta', 'Sin apps no oficiales'],
      funcionesEtiqueta: 'Qué es Conext',
      funcionesTitulo: 'Un CRM para tus canales, no un chatbot.',
      funcionesTexto:
        'Conext centraliza los mensajes de tus canales para que una pyme no tenga que atenderlos en tres pantallas. La IA trabaja adentro, con tu catálogo y tus horarios, no con un árbol de opciones.',
      // Las cinco tarjetas de la línea: cada una es una ventaja de tener a los
      // agentes atendiendo, con su número grande. El `tag` monoespaciado es el
      // rótulo corto de qué mide, y la última cierra la cuenta y va en oscuro.
      ahorroEtiqueta: 'Lo que se gana',
      ahorroTitulo: 'Cinco números de un día con Conext.',
      ahorroTexto:
        'Lo que pasa cuando los agentes atienden: nadie espera, nada se pierde y la última palabra sigue siendo tuya.',
      ahorros: [
        {
          id: 'respuesta',
          tag: 'RESPUESTA',
          figura: '30 s',
          metrica: 'Primera respuesta',
          contexto: 'El agente contesta apenas entra el mensaje, a cualquier hora del día.',
        },
        {
          id: 'simultaneo',
          tag: 'VOLUMEN',
          figura: '20+',
          metrica: 'Chats a la vez',
          contexto: 'Veinte personas preguntando al mismo tiempo reciben respuesta al mismo tiempo.',
        },
        {
          id: 'horario',
          tag: 'HORARIO',
          figura: '24/7',
          metrica: 'Siempre atendido',
          contexto: 'A las tres de la mañana contesta el aviso de horario, no el silencio.',
        },
        {
          id: 'canales',
          tag: 'CANALES',
          figura: '3',
          metrica: 'Canales, una bandeja',
          contexto: 'WhatsApp, Instagram y Messenger entran al mismo lugar y el hilo sigue.',
        },
        {
          id: 'tiempo',
          tag: 'TU DÍA',
          figura: '4 h',
          metrica: 'Que vuelven al día',
          contexto: 'El rato que se iba en repetir precios, stock y horarios, de vuelta en el negocio.',
        },
      ],
      ahorroResumen: [
        { figura: '0', label: 'Mensajes sin responder' },
        { figura: '2', label: 'Modos: automático o borrador' },
        { figura: '100 %', label: 'Sobre la API oficial de Meta' },
      ],
      funciones: [
        {
          id: 'bandeja',
          titulo: 'Una sola bandeja',
          texto:
            'WhatsApp, Instagram y Messenger entran al mismo lugar, con carpetas, etiquetas y estado de entrega. Se termina el "¿este ya lo contestó alguien?".',
        },
        {
          id: 'agentes',
          titulo: 'Agentes de IA para tu negocio',
          texto:
            'Creas un agente por tema (ventas, envíos, posventa) y le escribes su rol en español. El CRM no pide que programes nada.',
        },
        {
          id: 'automatico',
          titulo: 'Automático o borrador',
          texto:
            'Cada agente decide si manda su respuesta solo o te la deja escrita para que la revises. Un interruptor, agente por agente.',
        },
        {
          id: 'productos',
          titulo: 'Productos y stock',
          texto:
            'Los agentes responden precios y disponibilidad con tu catálogo a la vista, y la pantalla de inicio te avisa qué se está por acabar.',
        },
        {
          id: 'horarios',
          titulo: 'Horarios de atención',
          texto:
            'Tus días y tu horario, con un mensaje de fuera de hora que contesta a las tres de la mañana para que nadie se quede esperando.',
        },
        {
          id: 'dia',
          titulo: 'El día, medido',
          texto:
            'Cuánto respondió la IA y cuánto tú, cuánto tardaste en contestar, a qué hora se te llena de mensajes y qué quedó pendiente.',
        },
      ],
      grupos: [
        { nombre: 'Atención', bajada: 'WhatsApp, Instagram y Messenger, en su lugar.', ids: ['bandeja', 'horarios'] },
        { nombre: 'Inteligencia', bajada: 'Agentes de IA, con las reglas de tu negocio.', ids: ['agentes', 'automatico'] },
        { nombre: 'Operación', bajada: 'El día a día de una pyme, a mano.', ids: ['productos', 'dia'] },
      ],
      controlEtiqueta: 'El control',
      controlTitulo: 'La IA escribe. Tú decides si se envía.',
      controlTexto:
        'Los temas que ya sabes que responde bien, que los atienda sola. Los que tocan dinero, un descuento o un cliente enojado, que te esperen en el CRM. Se cambia de opinión con un clic, agente por agente.',
      pasosEtiqueta: 'Cómo funciona',
      pasosTitulo: 'Cómo funciona Conext, en tres pasos.',
      pasos: [
        {
          titulo: 'Conectas tus canales',
          texto:
            'Se enlaza tu WhatsApp Business, tu Instagram profesional y Messenger con tu cuenta de Meta. El número es tuyo y la cuenta también: si un día te vas, te los llevas.',
        },
        {
          titulo: 'Le cuentas cómo trabaja tu negocio',
          texto:
            'Cargas tus productos con precio y stock, tus días y horarios, y tus respuestas de siempre. Después armas los agentes que hagan falta.',
        },
        {
          titulo: 'Miras la bandeja de Conext',
          texto:
            'Los agentes atienden. Tú entras cuando algo necesita una persona, y la bandeja te marca exactamente cuáles son.',
        },
      ],
      garantiasEtiqueta: 'Por qué la vía oficial',
      garantiasTitulo: 'Automatizar WhatsApp sin arriesgar tu número.',
      garantiasTexto:
        'Las herramientas que se cuelgan de WhatsApp Web o de la app del teléfono funcionan hasta que Meta las detecta. Conext entra por la API oficial, que es la puerta que Meta abre para un CRM.',
      garantias: [
        {
          titulo: 'Tu número no corre riesgo',
          texto:
            'Todo pasa por la API oficial de WhatsApp Business, que es la vía que Meta habilita para automatizar. No hay que clonar una sesión ni dejar un teléfono enchufado en un rincón.',
        },
        {
          titulo: 'Varias personas, un número',
          texto:
            'Tu equipo y los agentes trabajan sobre la misma bandeja, cada uno con su usuario. Nadie tiene que pedir prestado el teléfono del local.',
        },
        {
          titulo: 'Tus datos son tuyos',
          texto:
            'Cada negocio tiene sus conversaciones separadas de las del resto y sus credenciales de WhatsApp guardadas cifradas. Y si quieres irte, se borra todo.',
        },
      ],
      faqEtiqueta: 'Preguntas',
      faqTitulo: 'Preguntas frecuentes sobre Conext',
      faqMas: 'Más preguntas, por tema, en el',
      faqCentro: 'centro de ayuda',
      preguntas: [
        {
          pregunta: '¿Qué es Conext?',
          respuesta:
            'Conext es un CRM para pequeñas empresas que centraliza los mensajes de WhatsApp, Instagram y Messenger en una sola bandeja. Los agentes de IA responden lo seguro o te dejan el borrador listo: la última palabra sigue siendo tuya. Corre sobre la API oficial de Meta, no sobre WhatsApp Web ni apps no oficiales.',
        },
        {
          pregunta: '¿Conext sirve solo para WhatsApp?',
          respuesta:
            'No. El CRM une WhatsApp, Instagram y Messenger, si tu Página lo tiene, en la misma bandeja. WhatsApp entra por la API oficial de WhatsApp Business; Instagram y Messenger, por la Página de Facebook del negocio.',
        },
        {
          pregunta: '¿Necesito un número nuevo?',
          respuesta:
            'No, puedes usar el que ya vienes usando, con una condición: un número conectado a la API no puede estar al mismo tiempo en la app de WhatsApp del teléfono. Si hoy lo atiendes a mano desde el teléfono y no quieres cortar eso todavía, lo más cómodo es empezar con un número aparte y pasar el principal cuando te sientas cómodo.',
        },
        {
          pregunta: '¿Y si el agente no sabe algo o mete la pata?',
          respuesta:
            'Para eso está el modo borrador: el agente escribe pero no envía hasta que tú lo apruebes. Es lo recomendable las primeras semanas, hasta que veas cómo responde con tus clientes reales. Cuando un tema ya lo maneja bien, le activas el envío automático solo a ese agente y dejas el resto esperando.',
        },
        {
          pregunta: '¿Mis clientes se dan cuenta de que les contesta una IA?',
          respuesta:
            'El mensaje les llega como cualquier otro de tu negocio, y el agente responde con el tono que tú le indiques. Del lado de adentro sí queda registrado quién contestó cada cosa, así puedes revisar cualquier conversación después.',
        },
        {
          pregunta: '¿Qué pasa con los datos de mis conversaciones?',
          respuesta:
            'Son tuyos y no se mezclan con los de otro negocio: cada cliente tiene su propio espacio en la base. Los tokens de WhatsApp se guardan cifrados. No vendemos datos ni se los pasamos a nadie. En el pie están la política de privacidad y cómo pedir la eliminación de datos.',
        },
        {
          pregunta: '¿Cuánto cuesta?',
          respuesta:
            'Hay una prueba de 7 días del Estándar (después $49/mes), un Premium y un plan a medida: el detalle está en Precios. El software se paga por mes. Aparte, Meta cobra las conversaciones directo a tu cuenta de Meta, con su tarifa. No le agregamos nada encima.',
        },
      ],
      ctaTitulo: 'Probalo con las conversaciones de tu negocio.',
      ctaTexto:
        'Siete días del Estándar completo, con tu catálogo cargado y WhatsApp, Instagram y Messenger conectados.',
      ctaBoton: 'Empezar gratis',
    },
    postulate: {
      title: 'Sumate al equipo | Conext',
      description:
        'Estamos armando el equipo que está construyendo conext. Dejanos tu nombre y tu correo, y te escribimos.',
      etiqueta: 'Estamos armando el equipo',
      titulo: 'Sumate al equipo de conext',
      bajada:
        'Buscamos gente para ayudarnos a construir conext desde el arranque. Dejanos tu nombre y tu correo, y te escribimos para charlar.',
      countdownEtiqueta: 'Esta ronda de postulaciones cierra en',
      dias: 'días',
      horas: 'hs',
      minutos: 'min',
      segundos: 'seg',
      nombrePh: 'Tu nombre',
      contactoPh: 'Tu correo',
      cta: 'Postularme',
      enviando: 'Enviando…',
      listoTexto: '¡Listo! Recibimos tu postulación. Si hay un buen fit, te escribimos.',
      errorTexto: 'No se pudo enviar. Probá de nuevo en un momento.',
    },
    precios: {
      title: 'Precios | Conext',
      description:
        'Planes de Conext para atender WhatsApp, Instagram y Messenger con IA: prueba de 7 días, estándar, premium y a medida.',
      etiqueta: 'Precios',
      titulo: 'Precios de Conext',
      bajada: 'Elegí el paquete que mejor le queda a tu negocio.',
      comparacion: 'Comparación de planes de Conext',
      masElegido: 'El más elegido',
      funcion: 'Función',
      incluido: 'Incluido',
      noIncluido: 'No incluido',
      nota: 'Importes en dólares (USD). Las conversaciones de WhatsApp las cobra Meta a tu cuenta, con su tarifa. No le agregamos un margen.',
      desliza: 'Deslizá la tabla para comparar los cuatro planes.',
      indecisoTitulo: '¿No estás seguro de qué plan te queda?',
      indecisoTexto: 'Cuéntanos cómo atiendes hoy y lo vemos con los números de tu operación.',
      indecisoCta: 'Escríbenos',
      faqTitulo: 'Preguntas sobre los planes.',
      periodicidad: 'Periodicidad del pago',
      mensual: 'Mensual',
      anual: 'Anual',
      ahorro: 'Ahorrá 20%',
      planes: [
        {
          id: 'gratis',
          nombre: 'Gratis',
          bajada: '7 días de Estándar',
          precio: '7 días',
          periodo: 'de prueba, después $49/mes',
          precioAnual: '7 días',
          periodoAnual: 'de prueba, después $39/mes facturado anual',
          cta: 'Empezar',
          destino: 'app',
        },
        {
          id: 'estandar',
          nombre: 'Estándar',
          bajada: 'Para equipos que crecen',
          precio: '$49',
          periodo: 'por mes',
          precioAnual: '$39',
          periodoAnual: 'por mes, facturado anual ($468)',
          cta: 'Empezar',
          destino: 'app',
        },
        {
          id: 'premium',
          nombre: 'Premium',
          bajada: 'Para equipos que escalan',
          precio: '$149',
          periodo: 'por mes',
          precioAnual: '$119',
          periodoAnual: 'por mes, facturado anual ($1.428)',
          cta: 'Empezar',
          destino: 'app',
          destacado: true,
        },
        {
          id: 'empresa',
          nombre: 'Empresa',
          bajada: 'Para organizaciones grandes',
          precio: 'A medida',
          periodo: 'contrato anual',
          precioAnual: 'A medida',
          periodoAnual: 'contrato anual',
          cta: 'Hablar con ventas',
          destino: 'email',
        },
      ],
      grupos: [
        {
          icono: 'users',
          nombre: 'Equipo',
          filas: [
            { nombre: 'Usuarios incluidos', valores: ['5', '5', '10', '25+'] },
            { nombre: 'Asientos adicionales', valores: ['$15/mes', '$15/mes', '$15/mes', 'Personalizado'] },
          ],
        },
        {
          icono: 'layout',
          nombre: 'Atención',
          filas: [
            { nombre: 'Número de WhatsApp', valores: ['1', '1', '2', 'Ilimitado'] },
            { nombre: 'Conversaciones', valores: ['Ilimitado', 'Ilimitado', 'Ilimitado', 'Ilimitado'] },
            { nombre: 'Carpetas y etiquetas', valores: [true, true, true, true] },
            { nombre: 'Horarios y fuera de hora', valores: [true, true, true, true] },
          ],
        },
        {
          icono: 'layers',
          nombre: 'Inteligencia',
          filas: [
            { nombre: 'Agentes de IA', valores: ['3', '3', 'Ilimitado', 'Ilimitado'] },
            { nombre: 'Envío automático', valores: [true, true, true, true] },
            { nombre: 'Productos en catálogo', valores: ['100', '100', '250', 'Ilimitado'] },
            { nombre: 'Borradores para revisar', valores: [true, true, true, true] },
          ],
        },
        {
          icono: 'lightbulb',
          nombre: 'Operación',
          filas: [
            { nombre: 'Métricas del día', valores: [true, true, true, true] },
            { nombre: 'Adjuntos salientes', valores: [true, true, true, true] },
            { nombre: 'API oficial de WhatsApp', valores: [true, true, true, true] },
            { nombre: 'Soporte', valores: ['Email', 'Email', 'Prioritario', 'Dedicado'] },
          ],
        },
      ],
      preguntas: [
        {
          pregunta: '¿Cómo funciona el plan gratis?',
          respuesta:
            'Es una semana del Estándar, sin cobro. Pedimos la tarjeta al entrar y el día 8 se cobra $49/mes, salvo que canceles antes. Durante la prueba tenés el plan completo, no un recorte.',
        },
        {
          pregunta: '¿Las conversaciones de WhatsApp las cobran ustedes?',
          respuesta:
            'No. Meta las cobra directo a tu cuenta de Meta, con su tarifa. Ese cobro no lo facturamos nosotros ni le agregamos un margen. Lo que se paga acá es el software.',
        },
        {
          pregunta: '¿Puedo cambiar de plan después?',
          respuesta:
            'Sí. Escribe con el nombre del negocio y lo ajustamos: más personas, más agentes o el paquete a medida si ya no entra en Premium.',
        },
      ],
    },
    ayuda: {
      title: 'Ayuda | Conext',
      description: 'Preguntas sobre facturación, cuentas, seguridad y datos en Conext. Si no está acá, escríbenos.',
      etiqueta: 'Ayuda',
      titulo: 'Preguntas, por tema.',
      bajada: 'Facturación, cuentas, seguridad y datos. Si el tema no está, el carril termina en un contacto.',
      explorar: 'Explorar por tema',
      atascado: '¿Todavía atascado?',
      atascadoTexto: 'Si el tema no está acá, escríbenos con tu caso y te respondemos nosotros.',
      contactar: 'Contactar',
      temas: [
        {
          id: 'facturacion',
          nombre: 'Facturación',
          preguntas: [
            {
              pregunta: '¿Cuánto cuesta conext?',
              respuesta:
                'Los planes y lo que incluye cada uno están en <a href="{precios}">Precios</a>. El software se paga por mes. Hay una prueba de 7 días del Estándar; después, $49/mes. Aparte, Meta cobra las conversaciones directo a tu cuenta, con su tarifa. No le agregamos un margen. Si el volumen no entra en un paquete, <a href="{correo}">escribinos</a> y armamos uno a medida.',
            },
            {
              pregunta: '¿Las conversaciones de WhatsApp las facturan ustedes?',
              respuesta:
                'No. Meta cobra las conversaciones directo a tu cuenta de Meta, con su tarifa. Ese cobro no lo facturamos nosotros ni le agregamos un margen.',
            },
            {
              pregunta: '¿Cómo pido una factura o cambio de plan?',
              respuesta:
                'Escribe a <a href="mailto:{email}">{email}</a> con el nombre del negocio. Si el cambio es de volumen (más personas, más conversaciones) conviene el mismo hilo: así no se cruza con una alta nueva.',
            },
          ],
        },
        {
          id: 'cuentas',
          nombre: 'Cuentas',
          preguntas: [
            {
              pregunta: '¿Cómo creo una cuenta?',
              respuesta:
                'El alta sale de <a href="{precios}">Precios</a>: elegís un plan, contestás cuatro preguntas y entrás. La pestaña de crear cuenta en el ingreso no abre un registro. A las personas del equipo las suma después el dueño del negocio.',
            },
            {
              pregunta: '¿Puede atender el mismo número más de una persona?',
              respuesta:
                'Sí. El equipo trabaja sobre la misma bandeja, cada uno con su usuario. Nadie tiene que pedir prestado el teléfono del local: el número está conectado a la cuenta del negocio, no a un aparato.',
            },
            {
              pregunta: '¿Cómo entro al panel?',
              respuesta:
                'Desde <a href="{login}">Iniciar sesión</a>, con el usuario que te dio el dueño del negocio. Si llegas desde este sitio, el nombre pasa al panel para no pedirte de nuevo lo mismo.',
            },
          ],
        },
        {
          id: 'seguridad',
          nombre: 'Seguridad',
          preguntas: [
            {
              pregunta: '¿Usan la API oficial de WhatsApp?',
              respuesta:
                'Sí. Todo entra y sale por la Cloud API de Meta. No se clona una sesión ni hace falta dejar un teléfono enchufado. El número y la cuenta de WhatsApp Business son tuyos: si un día te vas, te los llevas.',
            },
            {
              pregunta: '¿Cómo se guardan las credenciales?',
              respuesta:
                'El token de WhatsApp de cada negocio se cifra en reposo (AES-256-GCM) antes de guardarlo. Las claves de acceso se hashean; no quedan en texto. Un cliente no ve los datos de otro.',
            },
          ],
        },
        {
          id: 'datos',
          nombre: 'Datos',
          preguntas: [
            {
              pregunta: '¿De quién son las conversaciones?',
              respuesta:
                'Tuyas. Cada negocio tiene su espacio y no se mezcla con el del resto. No vendemos datos ni los usamos para anuncios. El detalle está en la <a href="{privacidad}">política de privacidad</a>.',
            },
            {
              pregunta: '¿Qué ve la inteligencia artificial?',
              respuesta:
                'El texto del mensaje y el contexto que el agente necesita (catálogo, instrucciones, historial reciente) se envían a Gemini para clasificar y redactar. No entrenamos un modelo propio con tus hilos.',
            },
            {
              pregunta: '¿Cómo pido que borren todo?',
              respuesta:
                'Las instrucciones están en <a href="{eliminar}">Eliminación de datos</a>. Escribe a <a href="mailto:{email}?subject=Eliminar%20datos">{email}</a> con el nombre del negocio y el número conectado, si lo tienes.',
            },
          ],
        },
      ],
    },
    login: {
      title: 'Entrar · conext',
      description: 'Entrá a tu cuenta de conext para atender el WhatsApp de tu negocio.',
      titular: 'Todo WhatsApp.',
      titularAcento: 'Una sola bandeja.',
      bajada: 'La IA clasifica cada mensaje, contesta lo seguro y te deja el resto redactado para revisar.',
      ventajas: ['Respuesta al instante', 'Borradores con IA', 'Datos por cliente'],
      acceso: 'Acceso',
      iniciarSesion: 'Iniciar sesión',
      crearCuenta: 'Crear cuenta',
      hola: 'Hola de nuevo',
      holaBajada: 'Entrá con Google o GitHub, o con tu correo.',
      oCorreo: 'o con tu correo',
      correo: 'Correo',
      correoPh: 'tu@negocio.com',
      contrasena: 'Contraseña',
      entrar: 'Entrar',
      pedirAcceso: 'Pedí tu acceso',
      pedirBajada:
        'Creá la cuenta con el mismo proveedor que uses todos los días, o escribinos y te dejamos el número conectado.',
      errorVacio: 'Escribí tu correo y tu contraseña.',
      errorCorreo: 'Ese correo no parece válido.',
    },
    error: {
      ir: 'Ir a conext',
      404: {
        title: 'Página no encontrada · conext',
        description: 'La página que buscás no existe o se mudó.',
        titulo: 'Página no encontrada',
        bajada: 'La página que buscás no existe o se mudó.',
      },
      500: {
        title: 'Algo salió mal · conext',
        description: 'No pudimos cargar esta página. Volvé al inicio o probá de nuevo en un momento.',
        titulo: 'Algo salió mal',
        bajada: 'No pudimos cargar esta página. Volvé al inicio o probá de nuevo en un momento.',
      },
    },
    empezar: {
      title: 'Empezar · conext',
      description: 'Cuatro preguntas cortas para dejar tu espacio de conext listo.',
      volver: 'Volver al inicio',
      atras: 'Atrás',
      continuar: 'Continuar',
      enter: 'Enter',
      otroPh: 'Contanos cuál',
      progreso: 'Paso {n} de {total}',
      listoTitulo: 'Listo. Te preparamos el espacio.',
      listoBajada: 'En un momento entras a conext.',
      // El otro final: contestó, pero no hay plan activo detrás de esa cuenta.
      // Los precios van acá mismo y no en un enlace a /precios — mandar a
      // elegir plan a otra página es pedirle a alguien que ya hizo algo por
      // nosotros que empiece de nuevo en otro lado.
      sinPlanTitulo: 'Todavía no tenés un plan activo.',
      sinPlanBajada:
        'Guardamos tus respuestas. Para entrar a conext falta elegir un plan: podés arrancar con la prueba de 7 días y no pagar nada hoy.',
      sinPlanNota: 'Ya elegiste uno y sigue diciendo esto: el pago puede tardar un minuto en llegar. Volvé a entrar en un rato.',
      sinPlanVolver: 'Volver a intentar entrar',
      planes: {
        gratis: 'Prueba de 7 días',
        estandar: 'Plan Estándar',
        premium: 'Plan Premium',
      },
      bienvenida: {
        titulo: 'Antes de entrar, cuatro preguntas.',
        bajada: 'Nos ayuda a dejar el espacio listo. Tarda menos de un minuto.',
        cta: 'Empezar',
      },
      pasos: [
        {
          id: 'origen',
          pregunta: '¿Dónde nos encontraste?',
          tipo: 'opciones',
          opciones: [
            { id: 'instagram', label: 'Instagram' },
            { id: 'google', label: 'Google' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'conocido', label: 'Me lo recomendó alguien' },
            { id: 'otro', label: 'Otro', otro: true },
          ],
        },
        {
          id: 'rubro',
          pregunta: '¿Qué tipo de negocio es?',
          tipo: 'opciones',
          opciones: [
            { id: 'tienda', label: 'Tienda o local' },
            { id: 'ecommerce', label: 'Tienda online' },
            { id: 'servicios', label: 'Servicios' },
            { id: 'gastro', label: 'Gastronomía' },
            { id: 'salud', label: 'Salud o estética' },
            { id: 'otro', label: 'Otro', otro: true },
          ],
        },
        {
          id: 'equipo',
          pregunta: '¿Cuántas personas atienden el WhatsApp?',
          tipo: 'opciones',
          opciones: [
            { id: '1', label: 'Solo yo' },
            { id: '2-5', label: '2 a 5' },
            { id: '6-15', label: '6 a 15' },
            { id: '16+', label: 'Más de 15' },
          ],
        },
        {
          id: 'nombre',
          pregunta: '¿Cómo te llamamos?',
          tipo: 'campos',
          campos: [
            { id: 'nombre', label: 'Tu nombre', ph: 'Ana', auto: 'name' },
            { id: 'negocio', label: 'El negocio', ph: 'Atelier Norte', auto: 'organization' },
          ],
        },
      ],
    },
    legal: {
      etiqueta: 'Legal',
      actualizada: 'Última actualización:',
      privacidadTitle: 'Privacidad | Conext',
      privacidadDescription:
        'Qué datos trata Conext, para qué, con quién se comparte y cómo pedir que se borren.',
      privacidadHeading: 'Política de privacidad',
      privacidadFecha: '20 de agosto de 2026',
      terminosTitle: 'Términos | Conext',
      terminosDescription: 'Las condiciones de uso del CRM Conext y de la conexión con WhatsApp Business.',
      terminosHeading: 'Términos y condiciones',
      terminosFecha: '20 de agosto de 2026',
      eliminarTitle: 'Borrar tus datos | Conext',
      eliminarDescription:
        'Cómo pedir que se borren tu cuenta, tus conversaciones y los datos asociados a Facebook Login en Conext.',
      eliminarHeading: 'Eliminación de datos de usuario',
      eliminarFecha: '20 de agosto de 2026',
    },
    mock: {
      nav: [
        { key: 'inicio', label: 'Inicio' },
        { key: 'bandeja', label: 'Bandeja', cuenta: '1', activo: true },
        { key: 'agentes', label: 'Agentes IA' },
        { key: 'productos', label: 'Productos' },
        { key: 'config', label: 'Configuración' },
      ],
      carpetas: [
        { label: 'Todas', cuenta: '8', activa: true },
        { label: 'Mías', cuenta: '3' },
        { label: 'Sin asignar', cuenta: '2' },
        { label: 'Pendientes', cuenta: '1' },
      ],
      agentes: [
        { label: 'Recepcionista', cuenta: '4', on: true },
        { label: 'Ventas', cuenta: '3', on: true },
        { label: 'Envíos', cuenta: '1', on: false },
      ],
      nuevoAgente: 'Nuevo agente',
      seccionCarpetas: 'Carpetas',
      seccionAgentes: 'Agentes IA',
      diaAbierto: 'Día abierto',
      desde: 'desde 9:12',
      cerrarDia: 'Cerrar día',
      adminRol: 'Administrador',
      chats: 'Chats',
      llamadas: 'Llamadas',
      abiertas: 'Abiertas, recientes',
      sugerida: 'Respuesta sugerida',
      laEscribio: ' · la escribió Ventas',
      descartar: 'Descartar',
      usarEditar: 'Usar y editar',
      escribe: 'Escribe un mensaje',
      fecha: 'Viernes, 14 de agosto',
      llamar: 'Llamar',
      copiar: 'Copiar',
      buscar: 'Buscar en la conversación',
      atendidaPor: 'Atendida por',
      responsable: 'Responsable',
      canal: 'Canal',
      etiquetas: 'Etiquetas',
      etiquetaVentas: 'ventas',
      masEtiqueta: '+ etiqueta',
      modoBorrador: 'borrador',
      modoAuto: 'automático',
      enviadoSolo: 'enviado solo',
      ahora: 'ahora',
      martinUltimo: '¿Aceptan transferencia?',
      lauraUltimo: 'Perfecto, lo retiro mañana',
      nicolasUltimo: '¿Hacen envíos a Córdoba?',
      carlaUltimo: 'Gracias! Cualquier cosa escribo',
      martinMsg1: 'Hola, ¿tienen la campera de jean en talle M?',
      martinMsg2: 'Sí, nos queda una en M. Sale $48.900 y si la pides hoy sale para tu casa mañana.',
      martinMsg3: 'Buenísimo. ¿Aceptan transferencia?',
      martinDraft:
        'Sí, aceptamos transferencia. Te paso los datos de la cuenta y en cuanto me envíes el comprobante lo despacho.',
      martinDraftCorto:
        'Sí, aceptamos transferencia. Te paso los datos y en cuanto me envíes el comprobante lo despacho.',
      lauraMsg: 'Quiero la de jean y la de cuero. ¿Me hacen precio por las dos?',
      lauraDraft: 'Sí, las dos juntas quedan en $102.000. Si te cierra te armo el pedido.',
      nicolasMsg: 'Hola! ¿Hacen envíos a Córdoba?',
      nicolasReply: 'Sí, enviamos a todo el país por Andreani. A Córdoba llega en 48 h y el envío sale $6.200.',
      nicolasLista: 'Sí, enviamos a todo el país por Andreani.',
      lauraPregunta: '¿Me hacen precio por las dos?',
      ventas: 'Ventas',
      envios: 'Envíos',
    },
    producto: productoEs,
    comparar: compararEs,
    integraciones: integracionesEs,
    docs: docsEs,
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    ogImageAlt: 'The conext mark',
    nav: {
      producto: 'Product',
      funciones: 'Features',
      funcionesBajada: 'What the CRM does with every message',
      comoFunciona: 'How it works',
      comoFuncionaBajada: 'From the first message to the reply',
      precios: 'Pricing',
      clientes: 'Customers',
      recursos: 'Resources',
      preguntas: 'FAQ',
      preguntasBajada: 'What people ask before signing up',
      ayuda: 'Help',
      ayudaBajada: 'Setup and day-to-day use',
      githubBajada: 'The project source',
      docs: 'Docs',
      docsBajada: 'Connect channels and set up the AI',
      integraciones: 'Integrations',
      integracionesBajada: 'WhatsApp, Instagram, and Meta events',
      comparar: 'Compare',
      compararBajada: 'Conext versus Respond.io, Wati, and Manychat',
      iniciarSesion: 'Log in',
      verPrecios: 'See pricing',
      empezarGratis: 'Start for free',
      abrirMenu: 'Open menu',
      cerrarMenu: 'Close menu',
      megaAtencion: 'Inbox',
      megaInteligencia: 'Intelligence',
      megaOperacion: 'Operations',
      megaPlataforma: 'Platform',
      megaDestacadoRotulo: 'Trial',
      megaDestacadoTitulo: 'Try it with your own chats',
      megaDestacadoTexto: 'Seven days of the full Standard plan, with your catalog and all three channels.',
      megaDestacadoCta: 'Start for free',
      megaPie: 'It all runs on the official WhatsApp Business API.',
      megaPieCta: 'See plans and pricing',
    },
    footer: {
      nav: 'Footer',
      idioma: 'Language',
      copyright: 'All rights reserved.',
      meta: 'WhatsApp is a registered trademark of Meta Platforms, Inc.',
      columnas: {
        producto: 'Product',
        atencion: 'Inbox',
        inteligencia: 'Intelligence',
        operacion: 'Operations',
        recursos: 'Resources',
        general: 'General',
        llm: 'LLM Resources',
        comparar: 'Compare',
        integraciones: 'Integrations',
        docs: 'Docs',
      },
      links: {
        funciones: 'Features',
        comoFunciona: 'How it works',
        garantias: 'Guarantees',
        bandeja: 'One inbox',
        horarios: 'Business hours',
        agentes: 'AI agents',
        automatico: 'Auto-send or draft',
        productos: 'Products and stock',
        dia: 'The day, measured',
        preguntas: 'FAQ',
        ayuda: 'Help center',
        facturacion: 'Billing',
        cuentas: 'Accounts',
        seguridad: 'Security',
        datos: 'Data',
        precios: 'Pricing',
        docs: 'Docs',
        integraciones: 'Integrations',
        comparar: 'Compare',
        login: 'Log in',
        legalesAyuda: 'Help',
        privacidad: 'Privacy',
        terminos: 'Terms',
        eliminar: 'Data deletion',
        llms: 'Read llms.txt',
      },
    },
    landing: {
      title: 'Conext | WhatsApp & Instagram CRM for small businesses',
      description:
        'Conext is the CRM for small businesses that brings WhatsApp, Instagram, and Messenger into one inbox. AI replies on its own or leaves a draft. Free for seven days.',
      anuncio: 'The CRM on the official Meta API',
      heroLineas: ['All your channels, one inbox.', 'Conext.'],
      heroBajada:
        'AI agents answer prices, stock, and shipping from your business data, or leave a draft. If the customer switches channels, the thread continues. The last word is yours.',
      heroCta: 'Apply',
      verComo: 'See how it works',
      heroMarcas: ['WhatsApp, Instagram, and Messenger', 'Official Meta API', 'No unofficial apps'],
      funcionesEtiqueta: 'What Conext is',
      funcionesTitulo: 'A CRM for your channels, not a chatbot.',
      funcionesTexto:
        'Conext puts your channel messages in one place so a small business is not answering from three screens. The AI works inside, with your catalog and hours, not a tree of options.',
      ahorroEtiqueta: 'What you get',
      ahorroTitulo: 'Five numbers from a day with Conext.',
      ahorroTexto:
        'What happens when the agents are on duty: nobody waits, nothing gets lost, and the last word is still yours.',
      ahorros: [
        {
          id: 'respuesta',
          tag: 'RESPONSE',
          figura: '30 s',
          metrica: 'First response',
          contexto: 'The agent replies the moment the message lands, any time of day.',
        },
        {
          id: 'simultaneo',
          tag: 'VOLUME',
          figura: '20+',
          metrica: 'Chats at once',
          contexto: 'Twenty people asking at the same time get an answer at the same time.',
        },
        {
          id: 'horario',
          tag: 'HOURS',
          figura: '24/7',
          metrica: 'Always covered',
          contexto: 'At 3 a.m. what answers is the after-hours notice, not the silence.',
        },
        {
          id: 'canales',
          tag: 'CHANNELS',
          figura: '3',
          metrica: 'Channels, one inbox',
          contexto: 'WhatsApp, Instagram, and Messenger land in the same place and the thread continues.',
        },
        {
          id: 'tiempo',
          tag: 'YOUR DAY',
          figura: '4 h',
          metrica: 'Back in your day',
          contexto: 'The time that went into repeating prices, stock, and hours, back in the business.',
        },
      ],
      ahorroResumen: [
        { figura: '0', label: 'Messages left unanswered' },
        { figura: '2', label: 'Modes: auto-send or draft' },
        { figura: '100 %', label: 'On the official Meta API' },
      ],
      funciones: [
        {
          id: 'bandeja',
          titulo: 'One inbox',
          texto:
            'WhatsApp, Instagram, and Messenger land in the same place, with folders, tags, and delivery status. No more “did someone already reply to this?”',
        },
        {
          id: 'agentes',
          titulo: 'AI agents for your business',
          texto:
            'You create an agent per topic (sales, shipping, after-sales) and write its role in plain language. The CRM does not ask you to code.',
        },
        {
          id: 'automatico',
          titulo: 'Auto-send or draft',
          texto:
            'Each agent decides whether to send on its own or leave the reply written for you to review. One switch, agent by agent.',
        },
        {
          id: 'productos',
          titulo: 'Products and stock',
          texto:
            'Agents answer prices and availability with your catalog in view, and the home screen warns you what is about to run out.',
        },
        {
          id: 'horarios',
          titulo: 'Business hours',
          texto:
            'Your days and hours, with an after-hours message that replies at 3 a.m. so nobody is left waiting.',
        },
        {
          id: 'dia',
          titulo: 'The day, measured',
          texto:
            'How much the AI answered and how much you did, how long you took to reply, when messages pile up, and what is still open.',
        },
      ],
      grupos: [
        { nombre: 'Inbox', bajada: 'WhatsApp, Instagram, and Messenger, in their place.', ids: ['bandeja', 'horarios'] },
        { nombre: 'Intelligence', bajada: 'AI agents, by your business rules.', ids: ['agentes', 'automatico'] },
        { nombre: 'Operations', bajada: 'The day-to-day of a small business, at hand.', ids: ['productos', 'dia'] },
      ],
      controlEtiqueta: 'Control',
      controlTitulo: 'AI writes. You decide if it sends.',
      controlTexto:
        'Topics it already handles well can go out on their own. Anything that touches money, a discount, or an angry customer waits for you in the CRM. You change your mind with one click, agent by agent.',
      pasosEtiqueta: 'How it works',
      pasosTitulo: 'How Conext works, in three steps.',
      pasos: [
        {
          titulo: 'You connect your channels',
          texto:
            'Your WhatsApp Business, professional Instagram, and Messenger are linked to your own Meta account. The number is yours and so is the account: if you leave one day, you take them with you.',
        },
        {
          titulo: 'You explain how your business works',
          texto:
            'You load products with price and stock, your days and hours, and the replies you already use. Then you set up the agents you need.',
        },
        {
          titulo: 'You watch the Conext inbox',
          texto:
            'The agents handle it. You step in when something needs a person, and the inbox shows you exactly which ones.',
        },
      ],
      garantiasEtiqueta: 'Why the official path',
      garantiasTitulo: 'Automate WhatsApp without putting your number at risk.',
      garantiasTexto:
        'Tools that hitch a ride on WhatsApp Web or the phone app work until Meta catches them. Conext goes in through the official API, the door Meta opens for a CRM.',
      garantias: [
        {
          titulo: 'Your number is not at risk',
          texto:
            'Everything goes through the official WhatsApp Business API, the path Meta enables for automation. No cloned session, no phone left plugged in in a corner.',
        },
        {
          titulo: 'Several people, one number',
          texto:
            'Your team and the agents work from the same inbox, each with their own user. Nobody has to borrow the shop phone.',
        },
        {
          titulo: 'Your data is yours',
          texto:
            'Each business has its conversations kept apart from the rest, and its WhatsApp credentials stored encrypted. If you want to leave, everything is deleted.',
        },
      ],
      faqEtiqueta: 'FAQ',
      faqTitulo: 'Frequently asked questions about Conext',
      faqMas: 'More questions, by topic, in the',
      faqCentro: 'help center',
      preguntas: [
        {
          pregunta: 'What is Conext?',
          respuesta:
            'Conext is a CRM for small businesses that brings WhatsApp, Instagram, and Messenger messages into one inbox. AI agents send what is safe or leave a draft ready: the last word is still yours. It runs on the official Meta API, not WhatsApp Web or unofficial apps.',
        },
        {
          pregunta: 'Is Conext only for WhatsApp?',
          respuesta:
            'No. The CRM brings WhatsApp, Instagram, and Messenger, if your Page has it, into the same inbox. WhatsApp comes in through the official WhatsApp Business API; Instagram and Messenger, through the business Facebook Page.',
        },
        {
          pregunta: 'Do I need a new number?',
          respuesta:
            'No. You can use the one you already have, with one catch: a number connected to the API cannot also be in the WhatsApp app on a phone. If you handle it by hand from the phone today and you are not ready to cut that yet, the easy path is to start with a spare number and move the main one when you are comfortable.',
        },
        {
          pregunta: 'What if the agent does not know something or gets it wrong?',
          respuesta:
            'That is what draft mode is for: the agent writes but does not send until you approve. That is the way to start for the first weeks, until you see how it replies to real customers. When it handles a topic well, you turn on auto-send for that agent only and leave the rest waiting.',
        },
        {
          pregunta: 'Will my customers know an AI is answering?',
          respuesta:
            'The message arrives like any other from your business, and the agent replies in the tone you set. On the inside we do log who answered each one, so you can review any thread later.',
        },
        {
          pregunta: 'What happens to my conversation data?',
          respuesta:
            'It is yours and it is not mixed with another business: each customer has their own space in the database. WhatsApp tokens are stored encrypted. We do not sell data or pass it on. The footer has the privacy policy and how to request deletion.',
        },
        {
          pregunta: 'How much does it cost?',
          respuesta:
            'There is a 7-day Standard trial (then $49/month), a Premium, and a custom plan: the breakdown is on Pricing. The software is billed monthly. On top of that, Meta charges for conversations directly on your Meta account, at their rate. We do not add a markup.',
        },
      ],
      ctaTitulo: 'Try it with your own conversations.',
      ctaTexto:
        'Seven days of the full Standard plan, with your catalog loaded and WhatsApp, Instagram, and Messenger connected.',
      ctaBoton: 'Start for free',
    },
    postulate: {
      title: "Join the team | Conext",
      description:
        "We're putting together the team building conext. Leave your name and your email, and we'll reach out.",
      etiqueta: "We're building the team",
      titulo: 'Join the conext team',
      bajada:
        "We're looking for people to help us build conext from the ground up. Leave your name and your email, and we'll reach out to talk.",
      countdownEtiqueta: 'This round of applications closes in',
      dias: 'days',
      horas: 'hrs',
      minutos: 'min',
      segundos: 'sec',
      nombrePh: 'Your name',
      contactoPh: 'Your email',
      cta: 'Apply',
      enviando: 'Sending…',
      listoTexto: "Done! We got your application. If there's a good fit, we'll reach out.",
      errorTexto: "Couldn't send it. Try again in a moment.",
    },
    precios: {
      title: 'Pricing | Conext',
      description:
        'Conext plans for WhatsApp, Instagram, and Messenger with AI: a 7-day trial, standard, premium, and custom.',
      etiqueta: 'Pricing',
      titulo: 'Conext Pricing',
      bajada: 'Choose the package that’s right for your company.',
      comparacion: 'Conext plan comparison',
      masElegido: 'Most popular',
      funcion: 'Feature',
      incluido: 'Included',
      noIncluido: 'Not included',
      nota: 'Prices are in US dollars (USD). WhatsApp conversations are billed by Meta to your account, at their rate. We do not add a markup.',
      desliza: 'Swipe the table to compare all four plans.',
      indecisoTitulo: 'Not sure which plan fits?',
      indecisoTexto: 'Tell us how you handle it today and we will look at it with your numbers.',
      indecisoCta: 'Write to us',
      faqTitulo: 'Questions about the plans.',
      periodicidad: 'Billing period',
      mensual: 'Monthly',
      anual: 'Annual',
      ahorro: 'Save 20%',
      planes: [
        {
          id: 'gratis',
          nombre: 'Free',
          bajada: '7 days of Standard',
          precio: '7 days',
          periodo: 'free trial, then $49/month',
          precioAnual: '7 days',
          periodoAnual: 'free trial, then $39/month billed annually',
          cta: 'Get started',
          destino: 'app',
        },
        {
          id: 'estandar',
          nombre: 'Standard',
          bajada: 'For growing teams',
          precio: '$49',
          periodo: 'per month',
          precioAnual: '$39',
          periodoAnual: 'per month, billed annually ($468)',
          cta: 'Get started',
          destino: 'app',
        },
        {
          id: 'premium',
          nombre: 'Premium',
          bajada: 'For scaling teams',
          precio: '$149',
          periodo: 'per month',
          precioAnual: '$119',
          periodoAnual: 'per month, billed annually ($1,428)',
          cta: 'Get started',
          destino: 'app',
          destacado: true,
        },
        {
          id: 'empresa',
          nombre: 'Enterprise',
          bajada: 'For large organizations',
          precio: 'Custom',
          periodo: 'annual contract',
          precioAnual: 'Custom',
          periodoAnual: 'annual contract',
          cta: 'Talk to sales',
          destino: 'email',
        },
      ],
      grupos: [
        {
          icono: 'users',
          nombre: 'Seats',
          filas: [
            { nombre: 'Users included', valores: ['5', '5', '10', '25+'] },
            { nombre: 'Additional seats', valores: ['$15/mo', '$15/mo', '$15/mo', 'Custom'] },
          ],
        },
        {
          icono: 'layout',
          nombre: 'Inbox',
          filas: [
            { nombre: 'WhatsApp numbers', valores: ['1', '1', '2', 'Unlimited'] },
            { nombre: 'Conversations', valores: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
            { nombre: 'Folders and tags', valores: [true, true, true, true] },
            { nombre: 'Business hours', valores: [true, true, true, true] },
          ],
        },
        {
          icono: 'layers',
          nombre: 'Intelligence',
          filas: [
            { nombre: 'AI agents', valores: ['3', '3', 'Unlimited', 'Unlimited'] },
            { nombre: 'Auto-send', valores: [true, true, true, true] },
            { nombre: 'Products in catalog', valores: ['100', '100', '250', 'Unlimited'] },
            { nombre: 'Drafts for review', valores: [true, true, true, true] },
          ],
        },
        {
          icono: 'lightbulb',
          nombre: 'Operations',
          filas: [
            { nombre: 'Day metrics', valores: [true, true, true, true] },
            { nombre: 'Outbound attachments', valores: [true, true, true, true] },
            { nombre: 'Official WhatsApp API', valores: [true, true, true, true] },
            { nombre: 'Support', valores: ['Email', 'Email', 'Priority', 'Dedicated'] },
          ],
        },
      ],
      preguntas: [
        {
          pregunta: 'How does the free plan work?',
          respuesta:
            'It is one week of Standard, with no charge. We ask for a card when you start, and on day 8 we bill $49/month unless you cancel first. During the trial you get the full plan, not a cut-down version.',
        },
        {
          pregunta: 'Do you bill WhatsApp conversations?',
          respuesta:
            'No. Meta charges them directly to your Meta account, at their rate. We do not invoice that charge or add a markup. What you pay here is the software.',
        },
        {
          pregunta: 'Can I change plans later?',
          respuesta:
            'Yes. Write us with the business name and we will adjust: more people, more agents, or the custom package if Premium no longer fits.',
        },
      ],
    },
    ayuda: {
      title: 'Help | Conext',
      description: 'Questions about billing, accounts, security, and data in Conext. If it is not here, write us.',
      etiqueta: 'Help',
      titulo: 'Questions, by topic.',
      bajada: 'Billing, accounts, security, and data. If the topic is not here, the rail ends in a contact.',
      explorar: 'Browse by topic',
      atascado: 'Still stuck?',
      atascadoTexto: 'If the topic is not here, write us with your case and we will reply ourselves.',
      contactar: 'Contact',
      temas: [
        {
          id: 'facturacion',
          nombre: 'Billing',
          preguntas: [
            {
              pregunta: 'How much does conext cost?',
              respuesta:
                'Plans and what each one includes are on <a href="{precios}">Pricing</a>. The software is billed monthly. There is a 7-day Standard trial; after that, $49/month. Meta charges conversations directly to your account, at their rate. We do not add a markup. If the volume does not fit a package, <a href="{correo}">write us</a> and we will put a custom one together.',
            },
            {
              pregunta: 'Do you bill WhatsApp conversations?',
              respuesta:
                'No. Meta charges conversations directly to your Meta account, at their rate. We do not invoice that charge or add a markup.',
            },
            {
              pregunta: 'How do I request an invoice or a plan change?',
              respuesta:
                'Write to <a href="mailto:{email}">{email}</a> with the business name. If the change is about volume (more people, more conversations), keep it in the same thread so it does not get mixed with a new signup.',
            },
          ],
        },
        {
          id: 'cuentas',
          nombre: 'Accounts',
          preguntas: [
            {
              pregunta: 'How do I create an account?',
              respuesta:
                'Signup starts at <a href="{precios}">Pricing</a>: you pick a plan, answer four questions, and you are in. The create-account tab on login does not open a registration form. Teammates are added afterwards by the business owner.',
            },
            {
              pregunta: 'Can more than one person handle the same number?',
              respuesta:
                'Yes. The team works from the same inbox, each with their own user. Nobody has to borrow the shop phone: the number is connected to the business account, not to a device.',
            },
            {
              pregunta: 'How do I get into the dashboard?',
              respuesta:
                'From <a href="{login}">Log in</a>, with the user the business owner gave you. If you arrive from this site, the name is passed to the dashboard so you are not asked for it again.',
            },
          ],
        },
        {
          id: 'seguridad',
          nombre: 'Security',
          preguntas: [
            {
              pregunta: 'Do you use the official WhatsApp API?',
              respuesta:
                'Yes. Everything in and out goes through Meta’s Cloud API. No cloned session, no phone left plugged in. The number and the WhatsApp Business account are yours: if you leave one day, you take them with you.',
            },
            {
              pregunta: 'How are credentials stored?',
              respuesta:
                'Each business’s WhatsApp token is encrypted at rest (AES-256-GCM) before it is stored. Access keys are hashed; they are not kept in plaintext. One customer cannot see another’s data.',
            },
          ],
        },
        {
          id: 'datos',
          nombre: 'Data',
          preguntas: [
            {
              pregunta: 'Who owns the conversations?',
              respuesta:
                'You do. Each business has its own space and it is not mixed with anyone else’s. We do not sell data or use it for ads. The detail is in the <a href="{privacidad}">privacy policy</a>.',
            },
            {
              pregunta: 'What does the AI see?',
              respuesta:
                'The message text and the context the agent needs (catalog, instructions, recent history) are sent to Gemini to classify and draft. We do not train our own model on your threads.',
            },
            {
              pregunta: 'How do I ask you to delete everything?',
              respuesta:
                'Instructions are in <a href="{eliminar}">Data deletion</a>. Write to <a href="mailto:{email}?subject=Delete%20data">{email}</a> with the business name and the connected number, if you have it.',
            },
          ],
        },
      ],
    },
    login: {
      title: 'Log in · conext',
      description: 'Log in to your conext account to handle your business WhatsApp.',
      titular: 'All of WhatsApp.',
      titularAcento: 'One inbox.',
      bajada: 'AI classifies every message, answers the safe ones, and leaves the rest drafted for you to review.',
      ventajas: ['Instant replies', 'AI drafts', 'Data per customer'],
      acceso: 'Access',
      iniciarSesion: 'Log in',
      crearCuenta: 'Create account',
      hola: 'Welcome back',
      holaBajada: 'Continue with Google or GitHub, or with your email.',
      oCorreo: 'or with your email',
      correo: 'Email',
      correoPh: 'you@business.com',
      contrasena: 'Password',
      entrar: 'Log in',
      pedirAcceso: 'Request access',
      pedirBajada:
        'Create the account with the provider you already use every day, or write us and we will leave the number connected.',
      errorVacio: 'Enter your email and password.',
      errorCorreo: 'That email does not look valid.',
    },
    error: {
      ir: 'Go to conext',
      404: {
        title: 'Page not found · conext',
        description: 'The page you are looking for doesn’t exist or has been moved.',
        titulo: 'Page not found',
        bajada: 'The page you are looking for doesn’t exist or has been moved.',
      },
      500: {
        title: 'Something went wrong · conext',
        description: 'We couldn’t load this page. Go home, or try again in a moment.',
        titulo: 'Something went wrong',
        bajada: 'We couldn’t load this page. Go home, or try again in a moment.',
      },
    },
    empezar: {
      title: 'Get started · conext',
      description: 'Four short questions to get your conext workspace ready.',
      volver: 'Back to home',
      atras: 'Back',
      continuar: 'Continue',
      enter: 'Enter',
      otroPh: 'Tell us which',
      progreso: 'Step {n} of {total}',
      listoTitulo: 'Done. We are setting up your workspace.',
      listoBajada: 'You will be in conext in a moment.',
      sinPlanTitulo: "You don't have an active plan yet.",
      sinPlanBajada:
        'We saved your answers. To get into conext you still need a plan: you can start with the 7-day trial and pay nothing today.',
      sinPlanNota: 'Already picked one and still seeing this? A payment can take a minute to reach us. Try again shortly.',
      sinPlanVolver: 'Try entering again',
      planes: {
        gratis: '7-day trial',
        estandar: 'Standard plan',
        premium: 'Premium plan',
      },
      bienvenida: {
        titulo: 'Before you go in, four questions.',
        bajada: 'It helps us get the workspace ready. Takes less than a minute.',
        cta: 'Start',
      },
      pasos: [
        {
          id: 'origen',
          pregunta: 'Where did you find us?',
          tipo: 'opciones',
          opciones: [
            { id: 'instagram', label: 'Instagram' },
            { id: 'google', label: 'Google' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'conocido', label: 'Someone recommended it' },
            { id: 'otro', label: 'Other', otro: true },
          ],
        },
        {
          id: 'rubro',
          pregunta: 'What kind of business is it?',
          tipo: 'opciones',
          opciones: [
            { id: 'tienda', label: 'Store or shop' },
            { id: 'ecommerce', label: 'Online store' },
            { id: 'servicios', label: 'Services' },
            { id: 'gastro', label: 'Food and hospitality' },
            { id: 'salud', label: 'Health or beauty' },
            { id: 'otro', label: 'Other', otro: true },
          ],
        },
        {
          id: 'equipo',
          pregunta: 'How many people handle WhatsApp?',
          tipo: 'opciones',
          opciones: [
            { id: '1', label: 'Just me' },
            { id: '2-5', label: '2 to 5' },
            { id: '6-15', label: '6 to 15' },
            { id: '16+', label: 'More than 15' },
          ],
        },
        {
          id: 'nombre',
          pregunta: 'What should we call you?',
          tipo: 'campos',
          campos: [
            { id: 'nombre', label: 'Your name', ph: 'Ana', auto: 'name' },
            { id: 'negocio', label: 'The business', ph: 'Atelier Norte', auto: 'organization' },
          ],
        },
      ],
    },
    legal: {
      etiqueta: 'Legal',
      actualizada: 'Last updated:',
      privacidadTitle: 'Privacy | Conext',
      privacidadDescription: 'What data Conext processes, why, who it is shared with, and how to ask for deletion.',
      privacidadHeading: 'Privacy policy',
      privacidadFecha: 'August 20, 2026',
      terminosTitle: 'Terms | Conext',
      terminosDescription: 'Terms of use for the Conext CRM and the WhatsApp Business connection.',
      terminosHeading: 'Terms and conditions',
      terminosFecha: 'August 20, 2026',
      eliminarTitle: 'Delete your data | Conext',
      eliminarDescription:
        'How to ask us to delete your account, your conversations, and data tied to Facebook Login in Conext.',
      eliminarHeading: 'User data deletion',
      eliminarFecha: 'August 20, 2026',
    },
    mock: {
      nav: [
        { key: 'inicio', label: 'Home' },
        { key: 'bandeja', label: 'Inbox', cuenta: '1', activo: true },
        { key: 'agentes', label: 'AI agents' },
        { key: 'productos', label: 'Products' },
        { key: 'config', label: 'Settings' },
      ],
      carpetas: [
        { label: 'All', cuenta: '8', activa: true },
        { label: 'Mine', cuenta: '3' },
        { label: 'Unassigned', cuenta: '2' },
        { label: 'Pending', cuenta: '1' },
      ],
      agentes: [
        { label: 'Reception', cuenta: '4', on: true },
        { label: 'Sales', cuenta: '3', on: true },
        { label: 'Shipping', cuenta: '1', on: false },
      ],
      nuevoAgente: 'New agent',
      seccionCarpetas: 'Folders',
      seccionAgentes: 'AI agents',
      diaAbierto: 'Day open',
      desde: 'since 9:12',
      cerrarDia: 'Close day',
      adminRol: 'Administrator',
      chats: 'Chats',
      llamadas: 'Calls',
      abiertas: 'Open, recent',
      sugerida: 'Suggested reply',
      laEscribio: ' · written by Sales',
      descartar: 'Dismiss',
      usarEditar: 'Use and edit',
      escribe: 'Write a message',
      fecha: 'Friday, August 14',
      llamar: 'Call',
      copiar: 'Copy',
      buscar: 'Search the conversation',
      atendidaPor: 'Handled by',
      responsable: 'Assignee',
      canal: 'Channel',
      etiquetas: 'Tags',
      etiquetaVentas: 'sales',
      masEtiqueta: '+ tag',
      modoBorrador: 'draft',
      modoAuto: 'auto',
      enviadoSolo: 'sent on its own',
      ahora: 'now',
      martinUltimo: 'Do you take bank transfer?',
      lauraUltimo: 'Perfect, I will pick it up tomorrow',
      nicolasUltimo: 'Do you ship to Córdoba?',
      carlaUltimo: 'Thanks! I will write if anything comes up',
      martinMsg1: 'Hi, do you have the denim jacket in size M?',
      martinMsg2: 'Yes, we have one left in M. It is $48,900 and if you order today it ships to you tomorrow.',
      martinMsg3: 'Great. Do you take bank transfer?',
      martinDraft:
        'Yes, we take bank transfer. I will send you the account details and as soon as you send the receipt I will ship it.',
      martinDraftCorto:
        'Yes, we take bank transfer. I will send you the details and as soon as you send the receipt I will ship it.',
      lauraMsg: 'I want the denim one and the leather one. Can you do a price for both?',
      lauraDraft: 'Yes, both together come to $102,000. If that works I will put the order together.',
      nicolasMsg: 'Hi! Do you ship to Córdoba?',
      nicolasReply: 'Yes, we ship nationwide with Andreani. Córdoba arrives in 48 hours and shipping is $6,200.',
      nicolasLista: 'Yes, we ship nationwide with Andreani.',
      lauraPregunta: 'Can you do a price for both?',
      ventas: 'Sales',
      envios: 'Shipping',
    },
    producto: productoEn,
    comparar: compararEn,
    integraciones: integracionesEn,
    docs: docsEn,
  },
}
