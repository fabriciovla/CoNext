# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

CRM de WhatsApp multi-cliente (SaaS): recibe mensajes por la Cloud API de Meta, los clasifica con Gemini, auto-responde los seguros y deja el resto como borrador para que una persona revise. Los comentarios del código están en español; mantené ese idioma al escribir nuevos.

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
- `/webhooks` va **antes** de `resolveTenant`: lo firma Meta y no puede mandar API key. Resuelve su tenant por el `phone_number_id` del payload (`getTenantByPhoneNumberId`); si no resuelve, el evento se descarta.
- `scripts/verifyIsolation.js` crea dos tenants y verifica que ninguna función de servicio ni ruta HTTP devuelva datos del otro. Es lo más cercano a una suite de tests que hay: **corrélo después de tocar cualquier servicio o consulta**. Una fuga acá no tiene arreglo posterior.
- Los tokens de WhatsApp de cada cliente se guardan cifrados con AES-256-GCM (`services/secrets.js`); las API keys, hasheadas con SHA-256 (determinístico a propósito: hay que poder buscar el tenant *por* la clave).

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

`services/channels/index.js` resuelve un adapter por `conversation.channel`. Solo WhatsApp funciona; Instagram está declarado pero dormido (falta la columna en `tenants` que ate una cuenta de IG a un cliente). El webhook ignora todo mensaje que no sea `type: 'text'` y lo loguea.

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

`useAuth` está suspendido: arranca autenticado como `admin`. Para reactivarlo, el `user` inicial vuelve a `null`.

`src/data/mockData.js` todavía existe y aporta constantes de UI (por ejemplo `weekDays`), no datos.

**El composer es un solo renglón**: el texto arranca en el borde izquierdo y todos los controles van juntos a la derecha, en un solo contenedor (emoji, adjuntar, nota interna, micrófono, enviar), con `items-end` para que todo quede apoyado en la base cuando el cuadro crece. Lo que no está adentro de la isla y no vuelve: el rótulo del canal (decía lo mismo en todos los mensajes), las respuestas rápidas y el recuadro de la sugerencia de IA. Lo que sí sale del cuadro pero se sigue diciendo va **arriba de la isla, en una línea**: el aviso de nota interna, los fallos del micrófono y la sugerencia. La sugerencia de IA es una tarjeta propia que se pliega a una línea al empezar a escribir y se vuelve a abrir con un click; `usarSugerenciaIA` fuerza el modo mensaje antes de bajar el texto, porque con el cuadro en nota interna la respuesta al cliente terminaba guardada como nota.

Los emojis son `src/data/emojis.js` (categorías + palabras de búsqueda en español) y los dibuja **la fuente del sistema del admin**: no hay pack de imágenes ni dependencia. `EmojiPicker` guarda los recientes en `localStorage`.

El adjunto elegido queda **pendiente** arriba del renglón hasta que se aprieta enviar, y lo que se escriba mientras tanto es su epígrafe. La nota de voz también pasa por ahí en vez de salir al soltar el botón: un audio mal grabado, ya enviado, solo se arregla mandando otro. El adjunto se suelta al cambiar de conversación (el texto no) — es de la conversación en la que se eligió, y aparecer con la foto de otro chat colgada del cuadro es exactamente cómo se le manda algo al contacto equivocado.

**El teléfono crudo es la identidad de una conversación** (la `key` de React, `assignments[phone]`, `drafts[phone]`, el argumento de toda mutación) y nunca se toca. `src/utils/phone.js` es solo para la pantalla: `formatPhone` da `+54 (381) 234-5678` — se come el `9` de móvil que Meta mete en el `wa_id`, porque es un prefijo para marcar y no parte del número —, `toE164` es lo que va en un `tel:` (ahí el `9` sí va), y `phoneDigits` normaliza para buscar, que es lo que permite tipear "381 234" y encontrar el número igual. Aguanta las dos formas que hay guardadas: el `wa_id` pelado del webhook y el `+54 9 11 2345-6789` escrito a mano del seed.

El logotipo es **`conext`** y vive en `ui/Logo.jsx`, que es una copia del de `site/src/components/Logo.jsx` — si cambia uno, cambian los dos. Es un `<text>` en un SVG, no trazados, así que depende de que **Baloo 2** esté servida (`@font-face` en `index.css`, el .woff2 en `public/fonts/`, el mismo archivo que usa la landing). Dos cosas que parecen de más y no lo son: `font-display: block`, porque el `viewBox` de 241 está calculado contra las métricas de Baloo 2 y con el fallback a Verdana el logo sale cortado — antes que mostrarlo mal, no lo muestra; y `fill="currentColor"`, que es lo que lo hace servir en los dos temas sin dos archivos. `public/conext-monochrome.svg` es el favicon de la landing y **no** sirve para esto: adentro tiene un `<image>` sin `href`.

Las dos imágenes de `public/` son WebP y se usan desde un solo componente cada una. `Avatar` con la prop **`photo`** dibuja el marcador gris de "sin foto" (`IconoSinFoto.webp`) y es lo que va en **todo contacto**: la Cloud API no nos da la foto de perfil de WhatsApp, y el nombre siempre está al lado. Sin `photo` sigue siendo la inicial, que es lo que usan los avatares del equipo (responsable, usuario de la barra, Bot/Admin del hilo). El logo va por `ui/WhatsappMark.jsx` (`logowsp.webp`) — antes era el mismo `path` de SVG copiado en la lista y en el composer. Si agregás imágenes nuevas, convertilas a WebP: `public/` se copia entero a `dist/`.

La barra de la izquierda es **una sola** (`components/AppNav.jsx`, montada por `Layout`) y se ve igual en todas las páginas: por eso el filtro de la bandeja, el día archivado que se está mirando y el plegado viven en `App.jsx` y no en `Inbox.jsx`. Entrar a un agente desde esa barra abre su configuración (`App` manda `focus` a la página de Agentes, que lo consume y lo suelta enseguida).

### Colores y temas

Hay dos temas y **ningún componente nombra un color**: todos usan la paleta semántica de `tailwind.config.js`, que sale de variables CSS definidas en `index.css` (`:root` = claro, `:root[data-theme='dark']` = oscuro; `useTheme` pone el atributo y lo guarda en `localStorage`, y un script en `index.html` lo aplica antes de que monte React para que no haya fogonazo).

- **`tint` es la tinta de superposición**: blanca en el tema oscuro, negra en el claro. Todo lo que antes era `bg-white/[0.04]`, `border-white/10` o `text-white/60` es `bg-tint/[0.04]`, `border-tint/10`, `text-tint/60`, y se da vuelta solo. **No escribas `white/…` ni `black/…` nuevos.**
- Superficies: `surface-page`, `surface-card`, `surface-raised`, `surface-nav`. El velo del modal es `bg-scrim`, la única variable que trae su alfa adentro: entre temas no cambia el color, cambia cuánto tapa (sobre la página clara, el negro al 80% del tema oscuro apagaba la pantalla entera para preguntar si borrás un producto).
- **El texto nunca lleva alfa.** Sale de la escala sólida `ink-primary` → `ink-secondary` → `ink-muted` → `ink-faint` (más `ink-inverted` para lo que va *encima* de un fondo `ink-primary`, como el botón sólido). Nada de `text-tint/40`: el alfa está calibrado contra un fondo, y el mismo valor que sobre negro se lee bien, sobre blanco desaparece. Cada nivel está elegido por tema para quedar arriba de 4.5:1 contra su fondo. `tint` con alfa es solo para **fondos, bordes y anillos**.
- Se quedan literales solo tres cosas, y a propósito: el blanco sobre `bg-accent-gradient` (el degradé de marca es el mismo en los dos temas), la perilla blanca de los interruptores (va sobre una pista de color) y el verde `#25d366` de WhatsApp.
- Los colores de estado también cambian por tema (en claro se oscurecen para que se lean sobre blanco). Texto encima de un fondo de estado sólido va con `text-status-ink`.
- Dentro de un SVG no hay clases de Tailwind: ahí se escribe `stroke="rgb(var(--ink-primary))"` a mano (ver `AreaChart`/`GaugeChart`).

### Reglas de forma

Cuatro reglas que mantienen la dashboard tranquila. Si algo nuevo desentona, casi siempre es porque rompe una:

- **El violeta es el único color con voz.** Los datos se dibujan en violeta (línea y área del `AreaChart`, arco del `GaugeChart`, barras de `HourlyActivity`, `ProgressBar`, interruptores encendidos) y el violeta también marca lo elegido. Los colores de estado (`status-*`) se guardan para estado real: stock, pendientes, errores. Un gráfico en negro plano no se lee como sobrio, se lee como sin terminar.
- **Las tarjetas se apoyan en el borde, no en la sombra.** `shadow-card` es un susurro y no cambia al pasar el mouse; una tarjeta solo reacciona si es clickeable (`<Card interactive>`). La sombra grande (`shadow-pop`) es de lo que de verdad flota: modal, menú, tooltip.
- **Nada de versalitas espaciadas.** Las etiquetas de campo, los encabezados de tabla y los rótulos de KPI van en minúscula, ~12px y en `ink-muted`/`ink-secondary`. La única excepción a propósito son los títulos de sección de la barra izquierda (`NavSection`). En mayúscula y con `tracking`, un rótulo pesa más que el dato que rotula.
- **Sin movimiento decorativo.** No hay `hover:-translate-y`, ni `active:scale`, ni degradés que barren la tarjeta. Lo que cambia al pasar el mouse es el color. Las animaciones de entrada (`stagger`, `animate-fade-*`) sí se quedan: ordenan la lectura, no adornan.

Las acciones destructivas siguen la misma lógica: en la fila o la tarjeta van como ícono (`IconTrash`) que recién toma color rojo al pasarle el mouse, y el rojo pleno (`<Button variant="danger">`) se reserva para el botón que confirma dentro del modal. Borrar un producto o un agente **siempre** pregunta antes.

Cuando una tarjeta entera abre algo (la lista de Agentes), no lleva un botón de "Editar": adentro va un `<button absolute inset-0>` que la cubre, el contenido se pone `pointer-events-none` para dejarle pasar los clicks y los controles que sí son suyos se los devuelven con `pointer-events-auto`. Un solo botón real, sin anidar unos dentro de otros. Los controles secundarios (reordenar, borrar) viven en un contenedor `opacity-0 group-hover:opacity-100 focus-within:opacity-100`, que **reserva el espacio igual**: si aparecieran con `hidden`, el resto de la fila saltaría al pasar el mouse.

Ojo con el `min-width: auto` de los items de grid y flex: `grid` a secas no deja que un item baje de su ancho mínimo de contenido, así que una tarjeta con texto largo se estira más allá del `max-w` del contenedor. Se declara `grid-cols-1` (que Tailwind escribe como `minmax(0, 1fr)`) y se pone `min-w-0` en **cada** flex de la cadena hasta el que trunca.

## Cosas que muerden

- **`daysOpen` no está normalizado entre extremos.** El frontend y `businessHours.js` usan `'Lun','Mar','Mié','Jue','Vie','Sáb','Dom'`; `provisionTenant` siembra `['lun','mar','mie','jue','vie']` en minúscula y sin acento, que nunca matchea y deja al cliente "cerrado" hasta que alguien guarda la configuración desde la UI.
- **Allow list del número de prueba de Meta.** En Argentina el `wa_id` que manda el webhook (`549…`) no es el mismo string que el número cargado en la consola (`54…15…`), y Meta responde 131030. Para eso está `WA_DEV_RECIPIENT_MAP` (formato `waId:destino,…`), solo desarrollo.
- **El `dev` del server vigila solo `src/`.** Era `node --watch`, que en Windows también observa `node_modules`: cualquier toque del antivirus o del indexador ahí adentro reiniciaba el server solo. Cada reinicio corta las requests en vuelo (la dashboard tira `ECONNRESET` y parece que los botones no hacen nada) y, peor, puede matar el procesamiento de un webhook después de haber respondido 200 — como el wamid ya quedó en `webhook_events`, el reintento de Meta se descarta por dedup y ese mensaje no se procesa nunca. Si volvés a tocar el script, mantené `--watch-path`.
- **Tocar `tailwind.config.js` pide reiniciar Vite.** El HMR no relee ese archivo: la dashboard sigue sirviendo el CSS viejo y parece que el cambio de color "no hizo nada" (o peor, se ve a medias, porque las clases nuevas todavía no existen en la hoja). `npm run build` sí lo toma, así que si el build se ve bien y el dev no, es esto.
- Sin credenciales de WhatsApp cargadas para el tenant, el adapter **simula** el envío y loguea en consola en vez de fallar. Con los adjuntos hace lo mismo: el archivo queda guardado en `uploads/` y se ve en el hilo, pero no salió para ningún lado.
- **El `<img>` de un adjunto también necesita la API key.** La pide como `/api/messages/media/:id`, así que la inyecta el proxy de Vite igual que cualquier request. Servido como build estático sin ese proxy, los adjuntos dan 401 — el mismo agujero que ya tiene toda la dashboard hasta que haya login de verdad.
- `repomix-output.xml` en la raíz es un volcado generado del repo; ignoralo.

## AGREGAR - IMPORTANTE

## Implementar la llamada al crm
## 