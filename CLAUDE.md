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

### Concurrencia

Varios patrones del código existen porque dos eventos del mismo contacto pueden entrar a la vez. No los simplifiques a leer-y-después-escribir: `ensureConversation` (upsert), el dedup de `webhook_events`, la reserva del aviso de ausencia, y el `DELIVERY_RANK` que impide que un estado de entrega retroceda cuando los acuses llegan desordenados.

### Días

La unidad de trabajo del CRM es el "día" (`days`), que se abre y cierra a mano, no por fecha. Sin día abierto no se puede enviar ni agregar notas, y un índice único garantiza uno solo abierto por tenant. `provisionTenant` abre el primero en el alta.

### Canales

`services/channels/index.js` resuelve un adapter por `conversation.channel`. Solo WhatsApp funciona; Instagram está declarado pero dormido (falta la columna en `tenants` que ate una cuenta de IG a un cliente). El webhook ignora todo mensaje que no sea `type: 'text'` y lo loguea.

### Base de datos

Postgres vía `pg` con un pool en `server/src/db/index.js`, que expone `query/one/many/run/tx`. Placeholders posicionales (`$1`), no `?` — se migró desde SQLite y quedan comentarios que lo mencionan. **Los alias de columna van entre comillas dobles** (`agent_key AS "agentKey"`): sin ellas Postgres los baja a minúscula y el campo llega vacío al frontend. Las columnas de `messages` que ve el frontend viven en un solo lugar, `services/messageColumns.js`.

### Frontend

Sin router ni librería de estado: `App.jsx` conmuta páginas con un `useState`, y cada dominio tiene su hook (`useMessages`, `useProducts`, `useAgents`, `useSettings`, `useQuickReplies`) que habla con la API por `src/api/client.js`. `useMessages` hace polling cada 6s (pausado con `document.hidden`) y, tras cada mutación, **re-consulta en vez de parchear el estado local** — el pipeline de IA puede cambiar cosas en el server entre nuestras propias acciones. Las excepciones son optimistas a propósito (etiquetas, asignación, cambio de agente), porque esperar el próximo poll se siente roto.

`useAuth` está suspendido: arranca autenticado como `admin`. Para reactivarlo, el `user` inicial vuelve a `null`.

`src/data/mockData.js` todavía existe y aporta constantes de UI (por ejemplo `weekDays`), no datos.

## Cosas que muerden

- **`daysOpen` no está normalizado entre extremos.** El frontend y `businessHours.js` usan `'Lun','Mar','Mié','Jue','Vie','Sáb','Dom'`; `provisionTenant` siembra `['lun','mar','mie','jue','vie']` en minúscula y sin acento, que nunca matchea y deja al cliente "cerrado" hasta que alguien guarda la configuración desde la UI.
- **Allow list del número de prueba de Meta.** En Argentina el `wa_id` que manda el webhook (`549…`) no es el mismo string que el número cargado en la consola (`54…15…`), y Meta responde 131030. Para eso está `WA_DEV_RECIPIENT_MAP` (formato `waId:destino,…`), solo desarrollo.
- Sin credenciales de WhatsApp cargadas para el tenant, el adapter **simula** el envío y loguea en consola en vez de fallar.
- `repomix-output.xml` en la raíz es un volcado generado del repo; ignoralo.

## AGREGAR - IMPORTANTE

## Implementar la llamada al crm
## 