-- Instagram y Messenger: los dos canales que faltaban.
--
-- No son dos integraciones, son una. Los dos hablan la Messenger Platform de
-- Meta: mismo webhook (`entry[].messaging[]`), mismo envío (`/me/messages` con
-- un token de Página) y misma ventana de 24h. Lo único que los separa es el
-- `object` del webhook ('page' contra 'instagram') y por cuál id se resuelve el
-- cliente.

-- 1. El canal nuevo.
--
-- El CHECK de `001_baseline` se escribió inline, así que Postgres lo bautizó
-- `conversations_channel_check`. Hay que tirarlo y rehacerlo: un CHECK no se
-- amplía en el lugar.
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_channel_check;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_channel_check
  CHECK (channel IN ('whatsapp', 'instagram', 'messenger'));

-- 2. Credenciales de Meta por cliente.
--
-- Un solo token de Página alcanza para los dos canales: la cuenta de Instagram
-- profesional cuelga de la Página, y Meta emite el permiso de mensajería para
-- las dos con el mismo token. Por eso hay un `page_access_token` y no dos.
ALTER TABLE tenants
  -- El webhook trae `entry[].id`, y eso es lo único que dice de quién es el
  -- mensaje: PAGE_ID cuando el object es 'page', IGID cuando es 'instagram'.
  -- UNIQUE por el mismo motivo que `phone_number_id`: es la clave de ruteo, y
  -- dos clientes con el mismo id sería entregarle los mensajes al equivocado.
  ADD COLUMN IF NOT EXISTS page_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ig_account_id TEXT UNIQUE,
  -- Cifrado en reposo igual que `access_token` (AES-256-GCM, services/secrets.js).
  -- Este token manda mensajes en nombre de la Página de un negocio ajeno.
  ADD COLUMN IF NOT EXISTS page_access_token TEXT,
  -- Para mostrar en Configuración de qué cuenta estamos hablando sin tener que
  -- ir a Graph en cada pintada de la pantalla.
  ADD COLUMN IF NOT EXISTS page_name TEXT,
  ADD COLUMN IF NOT EXISTS ig_username TEXT,
  ADD COLUMN IF NOT EXISTS meta_connected_at TEXT;

-- 3. Dedup de los entrantes de Messenger/Instagram.
--
-- `webhook_events` ya hace de dedup por wamid y sirve igual acá: el `mid` de
-- Meta cumple el mismo papel y entra en la misma columna. No hace falta tabla
-- nueva — solo queda dicho, porque el id ahora puede ser de tres canales.
