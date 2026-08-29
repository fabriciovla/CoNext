# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

CRM multi-cliente (SaaS) de los tres canales de mensajería de Meta —WhatsApp, Instagram y Messenger—: recibe mensajes por sus webhooks, los clasifica con Gemini, auto-responde los seguros y deja el resto como borrador para que una persona revise. Los comentarios del código están en español; mantené ese idioma al escribir nuevos.

Son tres proyectos npm independientes, cada uno con su `package.json` y su `node_modules`:

| Carpeta | Qué es | Dev |
| --- | --- | --- |
| raíz (`src/`) | Dashboard React + Vite + Tailwind | `npm run dev` (puerto 5173) |
| `server/` | API Express + Postgres | `npm run dev` (puerto 3001) |
| `site/` | Landing pública en Astro | `npm run dev` |

## Comandos

```bash
# server/ — hay que levantarlo antes que la dashboard
npm run dev                                  # node --watch, corre migrate() al arrancar
npm run tenant -- "Nombre del negocio" "+549…"   # alta de cliente; imprime la API key UNA sola vez
npm run tenant -- "Nombre" --connect-dev-wa      # + conecta el número de prueba (DEV_WA_* del .env)
npm run connect-wa -- <slug> "EAAT…"         # recarga el token de un cliente ya creado (vence cada 24h)
npm run connect-meta -- <slug> "EAAG…"       # conecta la Página (Messenger + Instagram) de un cliente
npm run seed -- <tenantId|slug>              # datos de ejemplo para un cliente ya creado
npm run simulate -- "+54911…" whatsapp "texto" "Nombre"   # dispara el pipeline completo sin Meta
node scripts/verifyIsolation.js              # ver abajo: es el único "test" del repo

# raíz
npm run dev / npm run build
```

No hay framework de tests ni `npm test`. `npm run lint` está declarado en el `package.json` de la raíz pero **eslint no está instalado ni hay config**, así que falla.

### Puesta en marcha desde cero

1. `server/.env` a partir de `.env.example`: `DATABASE_URL` (Postgres hospedada — Neon/Supabase/Railway; no hay Docker ni psql local en esta máquina), `ENCRYPTION_KEY` (32 bytes hex), `GEMINI_API_KEY`.
2. `npm run tenant -- "<negocio>"` → copiar la API key que imprime y ponerla como `API_KEY` en `server/.env`.
3. Levantar server y dashboard.

`API_KEY` en el `.env` **no es una clave del server**: es la clave del cliente que la dashboard local va a mirar. El proxy de Vite la lee del archivo y la inyecta como header `x-api-key` en cada request a `/api` (`vite.config.js`) — nunca pasa por `import.meta.env`, para que no quede escrita en el bundle.

Las migraciones se aplican solas al arrancar el server o cualquier script (`migrate()`); no hay comando aparte. Una migración nueva es un `.sql` en `server/src/db/migrations/`, se ordenan por nombre y cada una corre en su propia transacción.

## Arquitectura

### Multi-tenant: la regla que no se rompe

Todo dato pertenece a un cliente. `tenant_id` es la primera columna de toda clave primaria e índice, y **toda función de servicio recibe `tenantId` como primer argumento** — no existe una variante "sin tenant".

- `resolveTenant` (`server/src/middleware/resolveTenant.js`) está montado en `app.js` antes de todos los routers de negocio: resuelve `req.tenant` / `req.tenantId` a partir del hash de la API key. Si falla, la request muere ahí. El resto del código nunca lee la clave, lee `req.tenant` — cuando exista login de verdad, se reemplaza solo este middleware.
- `/webhooks` va **antes** de `resolveTenant`: lo firma Meta y no puede mandar API key. Resuelve su tenant por un id del payload, y cuál es depende del canal: `phone_number_id` en WhatsApp, `entry[].id` en Instagram y Messenger (que es el IGID o el PAGE_ID según el `object`). Las tres columnas son UNIQUE por el mismo motivo. Si no resuelve, el evento se descarta.
- `scripts/verifyIsolation.js` crea dos tenants y verifica que ninguna función de servicio ni ruta HTTP devuelva datos del otro. Es lo más cercano a una suite de tests que hay: **corrélo después de tocar cualquier servicio o consulta**. Una fuga acá no tiene arreglo posterior.
- Las personas del dashboard no son el tenant: `users` (perfil, enganchado a `auth.users` de Supabase) se une a `tenants` por `tenant_members` (rol `owner` / `admin` / `operador`). RLS deja ver solo los clientes de los que sos miembro; el server se conecta como `postgres`/`service_role` y se salta eso, porque el webhook de Meta no trae sesión.
- Los tokens de Meta de cada cliente —el de WhatsApp y el de la Página, que cubre Messenger e Instagram— se guardan cifrados con AES-256-GCM (`services/secrets.js`); las API keys, hasheadas con SHA-256 (determinístico a propósito: hay que poder buscar el tenant *por* la clave).

### El pipeline de un mensaje entrante

Todo entra por `handleIncomingMessage` (`services/conversationService.js`), tanto el webhook real como `/dev/simulate-incoming`:

1. `webhook_events` hace de dedup con un `INSERT … ON CONFLICT DO NOTHING` sobre el wamid; 0 filas = ya lo procesamos.
2. Se inserta el entrante como `pendiente` y se actualiza `last_inbound_at` (la ventana de servicio de 24h de WhatsApp).
3. Si está fuera de horario (`businessHours.js`), se manda el aviso de ausencia — con cooldown de 12h reservado por un `UPDATE` condicional, no por leer-y-después-escribir.
4. `classifyAndDraft` (`services/ai/`) hace **una sola** llamada a Gemini que elige agente, clasifica (`automatico` / `pendiente`), decide `canAutoSend` y redacta la respuesta. Se fuerza con `FunctionCallingConfigMode.ANY` y una única función declarada: así la salida siempre calza el schema y no hay texto libre que parsear.
5. Auto-envía solo si `category === 'automatico'` && `canAutoSend` && hay día abierto && está dentro de horario. El interruptor `autoSend` del agente es un techo sobre lo que decida el modelo.
6. Si no auto-envía (o si el envío falla), la respuesta queda como borrador en `conversations.ai_draft` para mandar a mano.

El webhook responde `200` de inmediato y procesa después — Meta reintenta agresivamente si tarda.

**Formato del mensaje: WhatsApp no es Markdown.** La negrita de WhatsApp es `*así*`, con un asterisco; un modelo escribe `**así**` por costumbre y al cliente le llegan los asteriscos a la vista. Se ataca por los dos lados: el prompt le pide el formato de WhatsApp, y `services/ai/whatsappFormat.js` traduce lo que igual se escape. La traducción se aplica en `classifyAndDraft`, sobre el `reply`, y no en el adapter: de ese mismo `reply` salen el mensaje que se envía **y** el borrador de `ai_draft`, así que traduciendo recién al enviar el borrador seguiría mostrando Markdown. La itálica de un asterisco (`*así*` en Markdown) no se traduce a propósito — después de convertir `**x**` en `*x*` es indistinguible, y errarle desarma la negrita recién armada.

### Concurrencia

Varios patrones del código existen porque dos eventos del mismo contacto pueden entrar a la vez. No los simplifiques a leer-y-después-escribir: `ensureConversation` (upsert), el dedup de `webhook_events`, la reserva del aviso de ausencia, y el `DELIVERY_RANK` que impide que un estado de entrega retroceda cuando los acuses llegan desordenados.

### Días

La unidad de trabajo del CRM es el "día" (`days`), que se abre y cierra a mano, no por fecha. Sin día abierto no se puede enviar ni agregar notas, y un índice único garantiza uno solo abierto por tenant. `provisionTenant` abre el primero en el alta.

### Canales

`services/channels/index.js` resuelve un adapter por `conversation.channel`. Son tres: `whatsapp`, `instagram` y `messenger`. Ningún adapter ignora un mensaje que no sea texto — eso lo corta el webhook, que loguea y descarta todo lo que no sea `type: 'text'` (WhatsApp) o un `message.text` (los otros dos).

**Instagram y Messenger son un solo canal con dos caras.** Los dos son la Messenger Platform: mismo webhook (`entry[].messaging[]`, y no `changes[]` como WhatsApp), mismo envío (`POST /me/messages` con un token de Página — el "me" lo resuelve Meta por el token, así que el código de envío es idéntico) y misma ventana de 24h. Por eso salen del mismo `metaAdapter.js` vía `crearAdapter(canal)` y no de dos archivos. El `instagramAdapter.js` que había antes hablaba de un `IG_BUSINESS_ACCOUNT_ID` global del `.env`, que no sobrevive al multi-cliente.

Lo único que los separa:

- El `object` del webhook: `'page'` (Messenger) contra `'instagram'`. Es lo que elige por cuál columna se resuelve el cliente, porque `entry[].id` es el PAGE_ID en uno y el IGID en el otro. Eso vive en `RESOLVER_POR_OBJETO`, en `webhooks.js`.
- De dónde salió el destinatario: PSID contra IGSID.

**Una sola Página conecta los dos.** La cuenta de Instagram profesional cuelga de la Página de Facebook, y Meta emite un único token con permiso sobre las dos. Por eso en `tenants` hay un `page_access_token` y no dos, y por eso la tarjeta de Configuración dice "Instagram y Messenger" y no tiene dos botones. Un negocio puede tener Página sin Instagram atado: ahí Messenger anda igual y la conexión avisa, no falla.

**El id de contacto va prefijado** (`services/channels/contactId.js`). La columna `conversations.phone` es la identidad de una conversación en todo el CRM —la clave primaria `(tenant_id, phone)`, el FK compuesto de `messages` y `conversation_tags`, la key de React, `assignments[phone]`, `drafts[phone]`— y se llama `phone` porque nació cuando el único canal era WhatsApp. Los IGSID y PSID son dígitos opacos del mismo largo que un `wa_id`: guardados pelados serían indistinguibles y dos personas distintas podrían caer en la misma fila. Así que Instagram guarda `ig:17841…` y Messenger `fb:24680…`; WhatsApp sigue pelado, que es lo que deja válidas las filas viejas sin migrar nada. `aIdExterno` saca el prefijo antes de hablar con Graph. En el frontend, `esTelefono` es lo que decide si se formatea como número: sin eso un IGSID se mostraría como `+17 (841) 405-7931`.

**Los acuses de Messenger no se parecen a los de WhatsApp.** WhatsApp nombra el mensaje (cada acuse trae el wamid). La Messenger Platform manda un **watermark**: "todo lo anterior a esta marca está entregado/leído", sin decir cuáles. De ahí sale `updateDeliveryStatusByWatermark`, que actualiza todas las salientes anteriores a esa marca; el equivalente del `DELIVERY_RANK` ahí es la lista de estados que no se pisan.

**El eco se descarta.** Si la app está suscripta a `message_echoes`, Meta nos devuelve nuestro propio envío como un evento más. Sin el corte por `message.is_echo`, cada respuesta que mandamos volvería a entrar como si la hubiera escrito el cliente y la IA se contestaría a sí misma en un bucle.

**El nombre del contacto hay que ir a buscarlo.** WhatsApp lo manda al lado del mensaje (`contacts[].profile.name`); acá el payload trae el id pelado, así que `getContactProfile` lo consulta a Graph. Falla en silencio a propósito: sin el permiso de perfil aprobado, es preferible una conversación titulada con el id que un mensaje que no se guarda.

**El estado de la conexión se pregunta por `debug_token`, no leyendo la Página.** `/meta/status` tiene que distinguir un token que sigue sirviendo de uno que el cliente revocó desde su Business Manager — si no, la pantalla diría "conectado" mientras no entra ni un mensaje. La forma obvia es leer la Página con el token guardado (`GET /me`, que firmada con un token de Página **es** esa Página), y esa forma **no funciona**: leer los datos de una Página exige `pages_read_engagement`, que no pedimos y que no queremos pedir — es un permiso más para justificar en el App Review a cambio de un nombre que ya tenemos guardado. Así que la consulta fallaba siempre, y como el catch trataba cualquier error como token muerto, la tarjeta mostraba *"Token vencido"* y el error crudo de Graph sobre una conexión sana. `verificarTokenPagina` le pregunta a Meta por el token en sí, firmando con el token de app (`app_id|app_secret`): no toca la Página, no pide ningún permiso, y `is_valid` sí se cae cuando revocan el acceso, que era lo único que había que detectar.

Dos consecuencias. Una: el nombre de la Página y la cuenta de Instagram ya no se refrescan en cada visita a la pantalla — salían de esa misma consulta que nunca anduvo, se guardan al conectar y se releen al reconectar, que es cuando `/me/accounts` los trae con el token de usuario y sin el permiso. Y dos: **un fallo de la verificación no es un token vencido**. Si faltan las credenciales de la app o `debug_token` no contesta, la conexión se deja como buena y se marca `verificado: false`; mandar a reconectar una Página que está bien por un problema nuestro de configuración es el error que esta pantalla ya cometía. Por eso tampoco dice "Token vencido": los tokens de Página sacados con un token de usuario largo **no vencen**, y ese rótulo mandaba a buscar una renovación que no existe.

**Los adjuntos salientes todavía no van por estos dos canales**, y no por el mismo motivo que en WhatsApp. WhatsApp sube el binario a Graph y después cita el id; Instagram quiere una **URL pública** del archivo, y los nuestros se sirven detrás de la API key (`GET /messages/media/:id`). Falta exponerlos por una URL firmada; hasta entonces `sendMedia` avisa qué falta en vez de fallar con un `is not a function`.

**El App Review es el que falta.** `pages_messaging` e `instagram_manage_messages` dependen de la verificación del negocio (la misma que tiene frenado a WhatsApp) más su propia revisión. Hasta que pase, esto funciona solo con cuentas que tengan un rol en la app — que alcanza para desarrollo y para grabar la demo. En la consola de Meta hay que suscribir la app al webhook `messages` de los productos Messenger e Instagram: sin eso la conexión queda perfecta y no llega ni un mensaje, que es el mismo silencio que en WhatsApp produce olvidarse de `subscribed_apps`.

### Plantillas

Son los mensajes con los que se puede escribir **primero**: pasadas las 24h de la ventana de servicio, Meta rechaza cualquier texto libre y lo único que sale es una plantilla aprobada. Es también lo que pide el App Review de `whatsapp_business_management` (hay que mostrar una creándose en video).

**No se guardan en nuestra base.** Viven en la WABA del cliente, las aprueba o rechaza Meta y el estado cambia sin avisarnos. Una copia local sería una copia desactualizada de algo cuya única fuente de verdad es Graph, así que `templatesService` las lee en vivo en cada request y `useTemplates` no hace nada optimista — se crea, se vuelve a preguntar y se dibuja lo que conteste Meta. No hay webhook de aprobación: el botón "Actualizar estados" es lo que hay.

- El **nombre** lo normaliza `normalizeName` (minúsculas, sin acentos, guiones bajos) porque la regla de Meta es angosta y rebota con un error que no dice cuál era el formato.
- Las **variables** van `{{1}}`, `{{2}}`… numeradas desde 1 y sin saltos; si el cuerpo salta del 1 al 3, Meta rechaza sin explicar. Se corta antes, en `validarVariables`. Y cada variable necesita un **ejemplo** o Meta contesta "missing example": si la pantalla no lo manda, se arma uno.
- Lo que se puede validar sin salir del server va **antes** de pedir las credenciales: son errores de lo que la persona escribió y se contestan igual esté o no conectado el WhatsApp.
- `AUTHENTICATION` queda afuera de las categorías a propósito: son las de código de un solo uso, con su propio formato de botones y su propia tarifa.
- Se borra **por nombre**, y eso borra todos los idiomas de esa plantilla — es lo que la consola de Meta llama eliminar.
### Adjuntos (salientes)

Mandar un archivo son **dos llamadas a Graph**, no una: primero se sube el binario a `/{phone_number_id}/media` como multipart y Meta devuelve un id, y recién después se manda el mensaje citando ese id (`adapter.sendMedia`). El pipeline entero es `POST /messages/media` (multipart, multer en memoria) → `guardarAdjunto` → `sendOutboundMedia`.

- **El archivo vive en el disco del server**, en `server/uploads/<tenant_id>/`, con nombre uuid; en la fila del mensaje quedan `media_kind/path/mime/name/size`. Meta borra su copia a los 30 días, así que la nuestra es la que sostiene el hilo viejo. `media_path` **no** sale en `MESSAGE_COLUMNS`: es una ruta del filesystem. La dashboard pide el archivo por `GET /messages/media/:id`, que es lo único que se puede scopear por tenant.
- La extensión se deriva del **mime**, nunca del nombre que subió el usuario — ahí es por donde entra un `../../`. El nombre original se guarda aparte, solo para mostrarlo y para el `filename` del documento.
- **Chrome graba en webm y WhatsApp no lo acepta**: las notas de voz van en ogg/opus. `mediaService` lo remuxea con `ffmpeg-static` (`-c:a copy`, y si el codec no era opus recodifica con libopus). Por eso el server tiene esa dependencia de ~80 MB.
- Los límites de tamaño por tipo (imagen 5 MB, audio/video 16 MB, documento 25 MB) se cortan en el servicio y no en Meta, que responde un error genérico. Lo que no está en la lista blanca de Meta (un `.webp`, un `.zip`) se manda como **documento**, que es el único tipo sin restricción de formato.
- Si el envío falla en cualquier punto, `sendOutboundMedia` **borra el archivo** antes de propagar: si no, cada rechazo de Meta dejaría un archivo huérfano que ninguna fila referencia.
- El audio no acepta epígrafe del lado de Meta. El composer, si había texto escrito, manda la nota de voz y después el texto como mensaje aparte.
- **Los adjuntos entrantes siguen sin procesarse**: el webhook mira solo `type: 'text'`. Recibirlos es el camino inverso (media id → URL firmada de Graph → bajar con el token del cliente) y todavía no está.

### Base de datos

Postgres vía `pg` con un pool en `server/src/db/index.js`, que expone `query/one/many/run/tx`. Placeholders posicionales (`$1`), no `?` — se migró desde SQLite y quedan comentarios que lo mencionan. **Los alias de columna van entre comillas dobles** (`agent_key AS "agentKey"`): sin ellas Postgres los baja a minúscula y el campo llega vacío al frontend. Las columnas de `messages` que ve el frontend viven en un solo lugar, `services/messageColumns.js`.

### Frontend

Sin router ni librería de estado: `App.jsx` conmuta páginas con un `useState`, y cada dominio tiene su hook (`useMessages`, `useProducts`, `useAgents`, `useSettings`) que habla con la API por `src/api/client.js`. `useMessages` hace polling cada 6s (pausado con `document.hidden`) y, tras cada mutación, **re-consulta en vez de parchear el estado local** — el pipeline de IA puede cambiar cosas en el server entre nuestras propias acciones. Las excepciones son optimistas a propósito (etiquetas, asignación, cambio de agente), porque esperar el próximo poll se siente roto.

**El login es de mentira y no autoriza nada.** `useAuth` acepta cualquier usuario y contraseña no vacíos y guarda `{ username }` en `localStorage` (`wsp-crm:user`); esa persistencia es lo que faltaba la primera vez que se intentó y lo que había obligado a suspenderlo, porque sin ella cada recarga volvía a la pantalla de ingreso. Lo que de verdad habilita las requests sigue siendo la API key que inyecta el proxy de Vite: esto solo decide qué se dibuja, y quien abra la consola entra igual. Cuando haya login posta se reemplaza el hook entero.

**La puerta de entrada es la landing, no la dashboard.** El "Iniciar sesión" de la barra del sitio va a `site/src/pages/login.astro`, que es la misma pantalla en Astro. Como vive en otro origen no puede dejarnos la sesión escrita, así que al entrar manda a `APP_URL/?u=<usuario>` (el nombre del correo, que es lo que la barra muestra al lado del avatar) y `useAuth` lo levanta, lo guarda y lo borra de la URL con `replaceState`. Sin ese traspaso, entrar por la landing te deja frente a un segundo formulario idéntico. Que el parámetro se pueda escribir a mano no agrega un agujero que no exista: ver el párrafo de arriba.

La pantalla es la misma de los dos lados, y si cambia una hay que cambiar la otra: dos columnas, panel de marca a la izquierda —que se esconde abajo de `lg`, porque apilado dejaba el campo de usuario debajo del pliegue— y formulario a la derecha. En el centro del panel va la marca sola (`LogoMarca`, no el logotipo entero); el interruptor de tema (solo en la dashboard, el sitio es claro y nada más) arriba a la derecha. Dos diferencias que no son descuido: la dashboard pide usuario y la landing correo, y la pestaña "Crear cuenta" no crea nada en ninguna de las dos —los clientes se dan de alta por `npm run tenant`—, así que en la app dice que el acceso lo da el dueño del negocio y en el sitio ofrece pedir una demo por WhatsApp.

**El fondo del panel son dos `.orbe`**, el mismo resplandor violeta que la landing reparte entre sus secciones (`.fondo-seccion::before`). Entran mayormente fuera del panel, así que lo que se ve es el arco. En el sitio los dos comparten una sola regla en `site/src/index.css`; la dashboard tiene su propia copia en `src/index.css` porque no importa el CSS del sitio, y hay que tocar las dos. **Y la copia se desincronizó**: el sitio le sacó el anillo de 1px y pasó el degradé a cinco escalones, y la dashboard se quedó con la versión vieja, así que el mismo panel tenía una pelota con circunferencia a la vista de un lado y luz del otro. Ya están iguales; si se retoca una, se retoca la otra. Antes eran dos resplandores rosas desenfocados con `bg-accent-gradient` y **parpadeaban**: llevaban `opacity-[0.1]` y una entrada que animaba la opacidad hasta 1, así que aparecían a pleno y se apagaban de golpe al terminar el keyframe. Por eso el orbe no lleva ninguna clase de `opacity` — el alfa vive adentro del degradé — y por eso su entrada va en la misma declaración `animation` que el latido, que si no `.animate-fade-in` le pisaría el `fondo-respirar`.

**La barra del sitio es una franja lisa de 76px, no una isla.** Antes se encogía al scrollear y quedaba flotando y redondeada; se fue porque transicionarle `padding`, `border-radius` y una `box-shadow` grande la hacía repintar justo mientras la página scrollea, y porque una isla flotante es un elemento más pidiendo atención arriba de todo. Sigue siendo `sticky` y no `fixed` como la de dock.us: `fixed` la saca del flujo y obliga a compensar los 76px con padding en cada página, que es de donde salen los saltos de layout.

**La barra sigue la estructura de dock.us**: los enlaces pegados al logotipo a la izquierda y las acciones empujadas al extremo derecho con `ml-auto`. Antes iba todo junto a la derecha, que en 1440px deja la mitad izquierda vacía y mezcla navegación con acciones. Las acciones son tres escalones de peso —`Iniciar sesión` como texto pelado, `Pedir una demo` con borde, `Empezar gratis` sólido en el acento—; tres botones iguales serían tres botones que nadie aprieta. El sólido de `Boton` (`primario` y `acento`) es el azul de marca, no la tinta: un CTA oscuro se leía con el mismo peso que el secundario.

**Los desplegables son `<button>`, no `<a href="#">`.** No navegan a ningún lado, abren algo, y un enlace que abre un panel es lo que hace que el teclado y los lectores de pantalla lo anuncien mal. El estado vive en `aria-expanded` (de ahí sale también el giro del chevron, por `group-aria-expanded:rotate-180`) y el panel se cierra con `hidden`, que es `display: none`: escondido de cualquier otra forma seguiría siendo alcanzable por teclado desde el fondo. El click de afuera se escucha **en captura**, porque el listener del propio botón corre después y vuelve a abrir el que corresponda.

**`pendiente: true` en `ENLACES` marca los ítems sin destino.** Hoy son `Precios` y `Clientes`: la sección no existe todavía, así que el ancla no hace nada — no rompe, pero tampoco lleva a ningún lado. Están puestos porque el orden de la barra se decidió con ellos adentro. Cuando exista la sección se les saca la marca y andan solos. El isotipo de GitHub que estaba suelto en la barra se fue adentro del desplegable de Recursos.

**El ancho del contenido vive en `.contenedor`** (1440px, padding de 2rem), no en una cadena de clases repetida por archivo — antes era `mx-auto w-full max-w-6xl px-6` copiada en la barra, el pie, /ayuda y la landing. Los 1440 contra los 1152 de antes son la mitad grande de por qué la página se ve "en grande": no es nitidez, es que hay más hoja debajo del texto. **Al pie se le había escapado la migración** y se quedó con la cadena vieja, así que arrancaba y terminaba 144px adentro de la barra de arriba y del contenido de cualquier página; ya usa `.contenedor`.

**El encabezado de sección de la landing (`Titulo.astro`) va a dos columnas**: etiqueta y título a la izquierda, bajada a la derecha, apoyadas las dos en la misma línea de base (`items-end`). Apilados adentro de un `max-w-2xl` —que es como estaban— dejaban vacía la mitad derecha de cada una de las cinco secciones, y la página entera se leía corrida hacia la izquierda, como un documento y no como una portada. Sin bajada la fila vuelve a ser una sola columna: una segunda columna vacía marca el hueco en vez de taparlo.

En la versión de Astro, /login no usa `.reveal`: eso se muestra recién cuando el observer del layout lo cruza, y en una pantalla que no scrollea la fila de abajo se quedaba invisible para siempre (cae dentro del `rootMargin` negativo). Entra con `.animate-in` al cargar. El logo del panel comparte `view-transition-name: conext-logo` con el de la barra: al hacer clic en "Iniciar sesión" crece desde ahí (Chrome/Safari; Firefox recarga y anima igual, sin el morph). Los dos extremos ya no son el mismo dibujo —arriba el logotipo entero, en el panel la marca sola—, así que ahí las opacidades **sí** se cruzan; mientras fueron idénticos iba en `animation: none`, que era mejor. Es también la única página que se pide con `pantallaCompleta` en `Base.astro`, que le saca la barra, el pie y el fondo con cuadrícula.

`src/data/mockData.js` todavía existe y aporta constantes de UI (por ejemplo `weekDays`), no datos.

**El hilo es un chat, no una lista de tarjetas.** Las decisiones del hilo salen de mirar lo que hace WhatsApp, que es lo que esta pantalla está reflejando, y de una regla: nada se dice dos veces.

- **Los mensajes seguidos del mismo autor se agrupan.** `ChatPanel` calcula `primero`/`ultimo` con `mismoBloque` (mismo lado, mismo autor, mismo día y menos de `HUECO_BLOQUE_MS` de silencio) y `MessageBubble` los usa para dos cosas: entre globos del mismo bloque casi no hay aire y entre bloques sí, y la esquina corta —la "colita"— va solo en el último. El corte por silencio no es cosmético: dos "hola" seguidos son una andanada, los mismos dos "hola" con ocho horas en el medio son dos veces que el cliente escribió.
- **Los globos no llevan borde.** Un globo con contorno de 1px se lee como una tarjeta apilada y no como algo dicho; el relleno solo ya lo separa del fondo en los dos temas. La excepción es la nota interna, que conserva el suyo justamente porque no es un mensaje.
- **La hora, el rayo del agente y el acuse de entrega viven adentro del globo**, flotados a la derecha (`PieDelGlobo`). La tilde estaba suelta a la izquierda, contra nada, y el agente era un renglón entero abajo de cada respuesta automática: en un hilo donde el bot contesta seis veces la pantalla decía seis veces lo mismo que ya dice la ficha. El nombre del agente queda en el `title` del rayo, y sale de `message.agentKey` —el modelo elige agente por mensaje— y no del de la conversación.
- **`ink-faint` no se usa adentro de un globo**: la escala está calibrada contra `surface-*`, y sobre el violeta apagado del tema oscuro el nivel más tenue se queda en 3,2:1. El piso ahí es `ink-muted`.
- **El hilo no tiene animación de entrada.** Los globos entraban escalonados, uno atrás del otro, cada vez que se abría una conversación. Ningún chat hace eso —la charla ya pasó, está ahí— y era lo que hacía que abrir un contacto se sintiera una demo. Es la excepción a la regla de que las animaciones de entrada se quedan.
- **Lo pendiente lo dice el tinte del globo y nada más.** La palabra "Pendiente" colgaba abajo de cada entrante sin atender, que es la tercera copia del mismo dato: la lista ya lo cuenta en la burbuja naranja y la ficha ofrece resolverlos. Lo que sí se sigue diciendo con todas las letras es el envío fallido, que es el único caso en que el cliente no recibió nada.

**El composer es un solo renglón**: el texto arranca en el borde izquierdo y todos los controles van juntos a la derecha, en un solo contenedor (emoji, adjuntar, nota interna, micrófono, enviar), con `items-end` para que todo quede apoyado en la base cuando el cuadro crece. Lo que no está adentro de la isla y no vuelve: el rótulo del canal (decía lo mismo en todos los mensajes), las respuestas rápidas y el recuadro de la sugerencia de IA. Lo que sí sale del cuadro pero se sigue diciendo va **arriba de la isla, en una línea**: el aviso de nota interna, los fallos del micrófono y la sugerencia. La sugerencia de IA es una tarjeta propia que se pliega a una línea al empezar a escribir y se vuelve a abrir con un click; `usarSugerenciaIA` fuerza el modo mensaje antes de bajar el texto, porque con el cuadro en nota interna la respuesta al cliente terminaba guardada como nota. **Es una tarjeta callada**: fondo neutro, sin ícono de chispas, sin franja separada abajo y sin botón sólido. Iba en violeta pleno con las chispas adentro de un cuadradito y un "Usar y editar" lleno del acento, que en esa esquina de la pantalla le competía de igual a igual al de enviar —para una cosa que ni siquiera sale— y era, junto con los rótulos del agente, lo que hacía que la bandeja se leyera como la demo de un producto de IA. El acento queda en el texto de "Usar y editar" y nada más.

Los emojis son `src/data/emojis.js` (categorías + palabras de búsqueda en español) y los dibuja **la fuente del sistema del admin**: no hay pack de imágenes ni dependencia. `EmojiPicker` guarda los recientes en `localStorage`.

El adjunto elegido queda **pendiente** arriba del renglón hasta que se aprieta enviar, y lo que se escriba mientras tanto es su epígrafe. La nota de voz también pasa por ahí en vez de salir al soltar el botón: un audio mal grabado, ya enviado, solo se arregla mandando otro. El adjunto se suelta al cambiar de conversación (el texto no) — es de la conversación en la que se eligió, y aparecer con la foto de otro chat colgada del cuadro es exactamente cómo se le manda algo al contacto equivocado.

**El teléfono crudo es la identidad de una conversación** (la `key` de React, `assignments[phone]`, `drafts[phone]`, el argumento de toda mutación) y nunca se toca. `src/utils/phone.js` es solo para la pantalla: `formatPhone` da `+54 (381) 234-5678` — se come el `9` de móvil que Meta mete en el `wa_id`, porque es un prefijo para marcar y no parte del número —, `toE164` es lo que va en un `tel:` (ahí el `9` sí va), y `phoneDigits` normaliza para buscar, que es lo que permite tipear "381 234" y encontrar el número igual. Aguanta las dos formas que hay guardadas: el `wa_id` pelado del webhook y el `+54 9 11 2345-6789` escrito a mano del seed.

El logotipo es la **marca** —dos formas superpuestas, "registros y contexto en capas"— y al lado el nombre **`conext`**. Vive en `ui/Logo.jsx`, que es una copia del de `site/src/components/Logo.jsx` — si cambia uno, cambian los dos. Ese archivo exporta dos: `Logo`, el logotipo entero, que es lo que va en las barras y en el pie; y `LogoMarca`, la marca sola, que va en el panel de /login, donde el nombre escrito le queda a un renglón del titular y los dos se pelean el centro. La marca no es una letra, así que aguanta sola a 16 px y es la que va en el ícono de app. En prosa el nombre se escribe entero y en minúscula, "conext".

La marca sale del pliego `design/conext-logo/` tal cual. **El nombre va en Satoshi Medium**: la misma familia que el resto del texto, y en un peso liviano a propósito — la marca ya es una mancha sólida, y un nombre pesado al lado suma peso sobre peso. El pliego lo dibuja en Instrument Sans SemiBold y eso no se usa; antes de Satoshi fue Baloo 2 ExtraBold, que es de donde venía ese exceso. Satoshi no tiene SemiBold estático (sus pesos son 300/400/500/700/900), así que el escalón que no es bold es el 500. Del logotipo viejo también se fue el punto final: el `conext.` con punto lo reemplaza la marca a la izquierda.

Las letras salen de la tabla `glyf` del TTF de Satoshi Medium: son contornos, no `<text>`. Que la familia del logotipo y la del texto sean ahora la misma no cambia eso — el logotipo no puede quedar a merced de que la fuente haya cargado, y como contornos el peso queda clavado en Medium aunque el archivo que se sirve sea el variable. El `viewBox` está ajustado **a la tinta y no a la caja tipográfica** — como `h-* w-auto` mide el viewBox, con la caja de la fuente el logotipo se dibujaría más chico de lo pedido y flotando sobre su propia línea de base.

**El SVG va en línea, dentro del componente, y se pinta con `currentColor`.** Ese es el punto entero: un `<img src="...svg">` se pinta aislado y no hereda nada del documento, así que como imagen el logotipo no podía tomar el color del tema. Los lugares que lo usan ya lo envolvían en `text-ink-primary` —negro `#18181b` en claro, blanco en oscuro—, y esas clases no hacían nada. Ahora mandan, y el logotipo sigue al fondo sin que ningún componente nombre un color. Que las dos formas de la marca se pinten del mismo color es lo que lo hace posible: **el hueco entre ellas no es un color, es una máscara**, así que la marca entera sale de `currentColor` y no hace falta una variante por tema (el pliego sí trae dos archivos, `conext-mark.svg` y `-light.svg`, porque un `<img>` no puede hacer esto).

**La máscara necesita un `id` y el logotipo se dibuja más de una vez en la misma página** (/login lo pinta en el panel y en la versión chica). Con un id fijo las dos instancias comparten la primera definición y la marca se rompe si esa se desmonta, así que el id sale de `useId()` — sin los dos puntos que mete, que adentro de un `url(#…)` molestan.

**Todo el encaje se mide entre tintas, no entre cajas.** La marca mide **0.966 del alto de la tinta del nombre**, y el aire del medio es de **0.30 em entre tintas**. El pliego lo da al revés —caja de la marca 58 contra un nombre de 50, con 20 de aire—, y así medido no funciona: la marca trae 21% de margen adentro de su propia caja, con lo que quedan 0.68 em de blanco a la vista y el logotipo se lee como dos cosas sueltas en vez de una. El nombre va centrado ópticamente contra la tinta de la marca, que tampoco es lo mismo que centrar su caja de línea.

`public/conext-logo.svg` tiene el mismo dibujo y queda para lo que necesite un archivo (prensa). **Son tres copias** —el SVG y los dos `Logo.jsx`—: si se retoca, van las tres.

Los tamaños son 20 px en la barra, 24 en el pie y en la barra de la dashboard. En el panel de /login no va el logotipo sino la marca sola, a 88.

El favicon y el ícono de app son **`conext-mark.svg`**, que es otra cosa que el logotipo: la **marca sola sobre la baldosa crema** `#F7F2E8` del pliego, con `rx` al 22% del lado. Los colores son literales a propósito y no salen de la paleta — esto no es el logotipo sino una insignia de tamaño fijo. La marca ocupa su caja de 512 sin reencuadrar. **El aire y el radio viven en el SVG, no en cada raster**: los PNG salen de ese archivo a tamaño completo, porque cuando cada ícono de app sumaba su propio margen encima el mismo dibujo terminaba con una proporción distinta según el archivo. Con la baldosa puesta no hace falta el `prefers-color-scheme` que este archivo tuvo cuando el glifo iba suelto: la marca nunca queda sobre el fondo del navegador, queda sobre el crema.

Del SVG salen `favicon.png` (32, respaldo para lo que no acepta favicon vectorial), `apple-touch-icon.png` (180, **sin redondear**: iOS le aplica su propia máscara y sobre un archivo ya redondeado se ve el borde crema comido por dentro del recorte) y, solo en el sitio, `icon-192/512.png` más `site.webmanifest`. El 512 es además el `og:image`, y por eso la tarjeta de Twitter va como `summary`: es cuadrado y `summary_large_image` espera 1200×630.

**El material de diseño no va en `public/`.** Apareció dos veces ahí (`public/conext logo design` y `site/public/logo design`, idénticas) y las dos veces se publicaba entero al build: 254 KB con el canvas y su `support.js` accesibles desde el dominio. Vive en `design/conext-logo/`, fuera del web root.

Las dos imágenes de `public/` son WebP y se usan desde un solo componente cada una. `Avatar` con la prop **`photo`** dibuja el marcador gris de "sin foto" (`IconoSinFoto.webp`) y es lo que va en **todo contacto que aparezca en una lista**: la Cloud API no nos da la foto de perfil de WhatsApp, así que es siempre el mismo dibujo, y lo que lo justifica es el nombre al lado. **En el hilo no va ninguno** — ahí no hay nombre al lado, la charla es de a dos y el marcador terminaba repetido en cada globo diciendo lo que ya dice la ficha de la derecha. Sin `photo` sigue siendo la inicial, que es lo que usan los avatares del equipo (responsable, usuario de la barra). El distintivo del canal va por `ui/ChannelMark.jsx`, que despacha por `conversation.channel`: WhatsApp sigue siendo `ui/WhatsappMark.jsx` (`logowsp.webp`, que trae su propio contorno blanco) y los otros dos son SVG en línea, porque no tenemos el archivo — a esos se les dibuja el contorno a mano, sin él el violeta de Instagram y el azul de Messenger se pegan al gris del avatar. Las tres marcas van con **color literal**, como el verde de WhatsApp: son de Meta y no cambian entre temas. La lista tenía el logo de WhatsApp fijo de cuando era el único canal; es el único lugar que dice por dónde se contesta, y contestar por el canal equivocado no se deshace. Si agregás imágenes nuevas, convertilas a WebP: `public/` se copia entero a `dist/`.

La barra de la izquierda es **una sola** (`components/AppNav.jsx`, montada por `Layout`) y se ve igual en todas las páginas: por eso el filtro de la bandeja, el día archivado que se está mirando y el plegado viven en `App.jsx` y no en `Inbox.jsx`. Entrar a un agente desde esa barra abre su configuración (`App` manda `focus` a la página de Agentes, que lo consume y lo suelta enseguida).

Arriba va el logotipo y, debajo, el **nombre del negocio** (`settings.storeName`, que baja por `App → AppNav → SideNav`). Antes iba el logotipo solo y centrado: centrado no se alinea con nada —las filas arrancan a 18px del borde, que es el `px-2` del contenedor más el `px-2.5` de `NavRow`— y solo no dice cuál de los clientes se está mirando, que en una app multi-cliente es lo primero que hay que poder contestar de un vistazo.

### Tipografía, colores y temas

**La tipografía es Satoshi**, variable (300 a 900 en un archivo de 42 KB), servida desde `public/fonts/satoshi-var.woff2` — hay una copia en cada proyecto y el `@font-face` está declarado en los dos `index.css`. Reemplazó a Inter, que en la dashboard venía de Google Fonts por un `<link>` en `index.html`: eso era una hoja de estilo bloqueante en otro dominio, con DNS y TLS por delante, solo para enterarse de cuál era el archivo de la fuente. Ahora se precarga desde el mismo origen. Ojo: el preload necesita `crossorigin` aunque sea del mismo origen, o el navegador se baja el archivo dos veces. El logotipo usa esta misma familia pero **no depende del archivo**: son contornos, no texto.

**El acento se sigue llamando `violet` en las clases pero es azul rey** (#4058ff en claro, #7b95ff en oscuro, que es el mismo azul aclarado porque sobre negro se apaga). El nombre quedó porque `text-violet` está escrito en medio proyecto y renombrarlo es un `sed` con más riesgo que valor. La tinta tampoco es un gris neutro: es #121722, un azul muy oscuro, y como `--tint` sale de ahí, los bordes y las superficies grises heredan esa temperatura. Los dos colores, más las superficies (#faf9f7 para `surface-nav`) y la escala de texto, salen de la paleta de **dock.us**, que es la referencia que se pidió seguir.

Lo único de esa paleta que no se copió tal cual es el nivel más tenue de texto: el #777c86 de ellos da 3.98:1 sobre #faf9f7 y no llega a 4.5. Acá `--ink-faint` es #686d7a, que da 4.92 sobre esa misma superficie.

Hay dos temas y **ningún componente nombra un color**: todos usan la paleta semántica de `tailwind.config.js`, que sale de variables CSS definidas en `index.css` (`:root` = claro, `:root[data-theme='dark']` = oscuro; `useTheme` pone el atributo y lo guarda en `localStorage`, y un script en `index.html` lo aplica antes de que monte React para que no haya fogonazo).

- **`tint` es la tinta de superposición**: blanca en el tema oscuro, negra en el claro. Todo lo que antes era `bg-white/[0.04]`, `border-white/10` o `text-white/60` es `bg-tint/[0.04]`, `border-tint/10`, `text-tint/60`, y se da vuelta solo. **No escribas `white/…` ni `black/…` nuevos.**
- Superficies: `surface-page`, `surface-card`, `surface-raised`, `surface-nav`. El velo del modal es `bg-scrim`, la única variable que trae su alfa adentro: entre temas no cambia el color, cambia cuánto tapa (sobre la página clara, el negro al 80% del tema oscuro apagaba la pantalla entera para preguntar si borrás un producto).
- **El texto nunca lleva alfa.** Sale de la escala sólida `ink-primary` → `ink-secondary` → `ink-muted` → `ink-faint` (más `ink-inverted` para lo que va *encima* de un fondo `ink-primary`, como el botón sólido). Nada de `text-tint/40`: el alfa está calibrado contra un fondo, y el mismo valor que sobre negro se lee bien, sobre blanco desaparece. Cada nivel está elegido por tema para quedar arriba de 4.5:1 contra su fondo. `tint` con alfa es solo para **fondos, bordes y anillos**.
- Se quedan literales solo tres cosas, y a propósito: el blanco sobre `bg-accent-gradient` (el degradé de marca es el mismo en los dos temas), la perilla blanca de los interruptores (va sobre una pista de color) y el verde `#25d366` de WhatsApp.
- Los colores de estado también cambian por tema (en claro se oscurecen para que se lean sobre blanco). Texto encima de un fondo de estado sólido va con `text-status-ink`.
- Dentro de un SVG no hay clases de Tailwind: ahí se escribe `stroke="rgb(var(--ink-primary))"` a mano (ver `AreaChart`/`GaugeChart`).

### Reglas de forma

Cinco reglas que mantienen la dashboard tranquila. Si algo nuevo desentona, casi siempre es porque rompe una:

- **Nada se centra.** El título de la página, su bajada y la acción de la sección van alineados a la izquierda, en una sola banda arriba de todo (`PageHeader`), con la acción empujada al extremo derecho. Antes el título iba centrado y la acción principal vivía **al final** de la página, también centrada (`PageActions`, que ya no existe): centrado, el título no rotula nada —flota en el medio de una fila vacía— y el botón queda a un scroll de distancia de la lista que modifica. La única excepción es `EmptyState`, donde no hay contenido con el que alinearse.
- **El acento es el único color con voz.** Los datos se dibujan en el acento (línea y área del `AreaChart`, arco del `GaugeChart`, barras de `HourlyActivity`, `ProgressBar`, interruptores encendidos) y el acento también marca lo elegido. Los colores de estado (`status-*`) se guardan para estado real: stock, pendientes, errores. Un gráfico en negro plano no se lee como sobrio, se lee como sin terminar.
- **Las tarjetas se apoyan en el borde, no en la sombra.** `shadow-card` es un susurro y no cambia al pasar el mouse; una tarjeta solo reacciona si es clickeable (`<Card interactive>`). La sombra grande (`shadow-pop`) es de lo que de verdad flota: modal, menú, tooltip.
- **Nada de versalitas espaciadas.** Las etiquetas de campo, los encabezados de tabla y los rótulos de KPI van en minúscula, ~12px y en `ink-muted`/`ink-secondary`. La única excepción a propósito son los títulos de sección de la barra izquierda (`NavSection`). En mayúscula y con `tracking`, un rótulo pesa más que el dato que rotula.
- **Sin movimiento decorativo.** No hay `hover:-translate-y`, ni `active:scale`, ni degradés que barren la tarjeta. Lo que cambia al pasar el mouse es el color. Las animaciones de entrada (`stagger`, `animate-fade-*`) sí se quedan: ordenan la lectura, no adornan.

Las acciones destructivas siguen la misma lógica: en la fila o la tarjeta van como ícono (`IconTrash`) que recién toma color rojo al pasarle el mouse, y el rojo pleno (`<Button variant="danger">`) se reserva para el botón que confirma dentro del modal. Borrar un producto o un agente **siempre** pregunta antes.

**El chrome de una página son tres piezas y ninguna se escribe a mano.** `PageHeader` (título + bajada + acción), `Card` (con `title`, `description` y `actions` propios, sin línea divisoria) y `EmptyState` (baldosa con el ícono, título, explicación y la acción abajo). Cada página venía metiendo un párrafo suelto entre el título y las tarjetas, y armando su propio estado vacío con un ícono a 20/28px y dos párrafos de tamaños distintos; eso es lo que hacía que las seis pantallas se vieran armadas por separado. La bajada del encabezado **no repite el nombre de la sección**: dice qué es lo que se está mirando (en Inicio, de qué día son los números).

**El techo de ancho es 1280px** (`Layout`), con `px-8`. Las páginas de formulario se ponen el suyo más angosto, pero **envolviendo también al encabezado** (Configuración va entera adentro de un `max-w-5xl`): con el techo puesto solo sobre las tarjetas, el aviso de guardado quedaba flotando 200px a la derecha de la última.

**El anillo de foco de teclado es una sola regla**, en `index.css`, sobre `:where(button, a, summary, [role='button'], [tabindex])`. `Button` e `Input` traen el suyo, pero las filas de la barra, los botones de ícono del composer, las pestañas de la bandeja y las carpetas de Productos son `<button>` pelados: navegando con Tab no se veía dónde estaba el cursor en media pantalla. Va en `:where()`, que tiene especificidad cero, así cualquier componente con su propio `focus-visible` (incluido el `outline-none` que Tailwind pone antes de un `ring`) le gana sin `!important`.

**El modal cierra con Escape y con un click en el velo, y bloquea el scroll de atrás** mientras está abierto. Sin lo primero, un modal abierto sin querer se cierra apuntándole a una cruz de 15px; sin lo segundo, la rueda mueve la página de abajo y el diálogo se queda quieto arriba de un fondo que se corre. Ojo con `WIDTHS`: `width="sm"` estaba en uso sin estar declarado, así que ese modal salía a todo el ancho de la pantalla.

Cuando una tarjeta entera abre algo (la lista de Agentes), no lleva un botón de "Editar": adentro va un `<button absolute inset-0>` que la cubre, el contenido se pone `pointer-events-none` para dejarle pasar los clicks y los controles que sí son suyos se los devuelven con `pointer-events-auto`. Un solo botón real, sin anidar unos dentro de otros. Los controles secundarios (reordenar, borrar) viven en un contenedor `opacity-0 group-hover:opacity-100 focus-within:opacity-100`, que **reserva el espacio igual**: si aparecieran con `hidden`, el resto de la fila saltaría al pasar el mouse.

Ojo con el `min-width: auto` de los items de grid y flex: `grid` a secas no deja que un item baje de su ancho mínimo de contenido, así que una tarjeta con texto largo se estira más allá del `max-w` del contenedor. Se declara `grid-cols-1` (que Tailwind escribe como `minmax(0, 1fr)`) y se pone `min-w-0` en **cada** flex de la cadena hasta el que trunca.

## Cosas que muerden

- **`daysOpen` no está normalizado entre extremos.** El frontend y `businessHours.js` usan `'Lun','Mar','Mié','Jue','Vie','Sáb','Dom'`; `provisionTenant` siembra `['lun','mar','mie','jue','vie']` en minúscula y sin acento, que nunca matchea y deja al cliente "cerrado" hasta que alguien guarda la configuración desde la UI.
- **La cadena directa de Supabase no resuelve.** `db.<ref>.supabase.co` publica solo registro AAAA, así que en una máquina sin IPv6 `getaddrinfo` responde ENOTFOUND, `migrate()` explota y el server no llega a escuchar. Como el proxy de Vite entonces no tiene con quién hablar, la dashboard muestra **500 en todas las requests** (`GET /conversations/meta falló (500)`) — que se lee como un bug del endpoint y no como "el server está caído". La cadena que anda es la del pooler: `postgresql://postgres.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:5432/postgres`, con el ref pegado al usuario. Ojo también con el 401 que viene después: si la base está vacía no hay tenant que matchee la `API_KEY` y `resolveTenant` corta todo — se arregla con `npm run tenant` y copiando la clave que imprime.

- **Allow list del número de prueba de Meta.** En Argentina el `wa_id` que manda el webhook (`549…`) no es el mismo string que el número cargado en la consola (`54…15…`), y Meta responde 131030. Para eso está `WA_DEV_RECIPIENT_MAP` (formato `waId:destino,…`), solo desarrollo.
- **El `dev` del server vigila solo `src/`.** Era `node --watch`, que en Windows también observa `node_modules`: cualquier toque del antivirus o del indexador ahí adentro reiniciaba el server solo. Cada reinicio corta las requests en vuelo (la dashboard tira `ECONNRESET` y parece que los botones no hacen nada) y, peor, puede matar el procesamiento de un webhook después de haber respondido 200 — como el wamid ya quedó en `webhook_events`, el reintento de Meta se descarta por dedup y ese mensaje no se procesa nunca. Si volvés a tocar el script, mantené `--watch-path`.
- **Tocar `tailwind.config.js` pide reiniciar Vite.** El HMR no relee ese archivo: la dashboard sigue sirviendo el CSS viejo y parece que el cambio de color "no hizo nada" (o peor, se ve a medias, porque las clases nuevas todavía no existen en la hoja). `npm run build` sí lo toma, así que si el build se ve bien y el dev no, es esto.
- Sin credenciales de WhatsApp cargadas para el tenant, el adapter **simula** el envío y loguea en consola en vez de fallar. Con los adjuntos hace lo mismo: el archivo queda guardado en `uploads/` y se ve en el hilo, pero no salió para ningún lado.
- **El `<img>` de un adjunto también necesita la API key.** La pide como `/api/messages/media/:id`, así que la inyecta el proxy de Vite igual que cualquier request. Servido como build estático sin ese proxy, los adjuntos dan 401 — el mismo agujero que ya tiene toda la dashboard hasta que haya login de verdad.
- **El SDK de Facebook se carga desde `src/lib/facebookSdk.js` y de ningún otro lado.** Configuración monta dos tarjetas que lo necesitan (WhatsApp y Meta). La versión anterior vivía adentro de `useWhatsappConnection` y no aguantaba dos llamadas: la segunda pisaba `window.fbAsyncInit` y devolvía una promesa que no resolvía nunca, así que el SDK le avisaba solo al último que preguntó y el botón del otro quedaba deshabilitado para siempre, sin ningún error. Ahora la promesa es del módulo. Si sumás una tercera pantalla que lo use, usá ese loader.
- `repomix-output.xml` en la raíz es un volcado generado del repo; ignoralo.

## AGREGAR - IMPORTANTE

## Implementar la llamada al crm
## 