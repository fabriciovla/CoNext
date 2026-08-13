-- Baseline multi-tenant sobre Postgres. Reemplaza a las seis migraciones de
-- SQLite (001_init … 006_delivery_status): como no había datos en producción,
-- no hace falta un camino de migración — sale más limpio y más barato escribir
-- el esquema ya nacido multi-cliente que portar seis migraciones y después
-- parchearles el tenant_id encima.
--
-- Regla que ordena todo el archivo: **ninguna tabla de negocio tiene clave
-- primaria global**. Todas arrancan con tenant_id y las claves son compuestas,
-- así una consulta a la que se le olvide el tenant no puede devolver datos de
-- otro cliente: no compila contra la clave, no es que "hay que acordarse del
-- WHERE". La fuga entre clientes es el único bug de este sistema que no tiene
-- arreglo después de que pasa.

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- Identificador legible para URLs y logs; nada de negocio depende de él.
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'suspendido')),

  -- Se guarda el SHA-256 de la clave, nunca la clave. Son tokens aleatorios de
  -- alta entropía, así que un hash rápido y determinístico alcanza: no hay
  -- diccionario que atacar como con una contraseña, y necesita ser
  -- determinístico para poder buscar por él en el login.
  api_key_hash TEXT NOT NULL UNIQUE,

  -- Credenciales de WhatsApp por cliente. Hoy salen del .env y valen para un
  -- solo negocio; con Embedded Signup las puebla el alta: Meta devuelve el
  -- WABA, el phone_number_id y un código que el server canjea por un token
  -- con alcance de ese cliente.
  waba_id TEXT,
  -- UNIQUE porque el webhook de Meta resuelve el tenant justamente por acá:
  -- todos los clientes entran por la misma URL y esto es lo que los separa.
  phone_number_id TEXT UNIQUE,
  -- Cifrado en reposo (AES-256-GCM, ver services/secrets.js). Es un token que
  -- permite mandar mensajes en nombre de un negocio ajeno: en texto plano, un
  -- volcado de la base entrega el WhatsApp de todos los clientes.
  access_token TEXT,
  -- Cuándo se conectó el número. Sirve para saber si el alta quedó a medias.
  connected_at TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Un renglón por cliente. Antes era CHECK (id = 1): la tabla entera asumía que
-- existía un solo negocio.
CREATE TABLE settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  days_open TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  away_message TEXT NOT NULL DEFAULT '¡Hola! Ahora estamos cerrados. Te respondemos apenas abramos 😊'
);

CREATE TABLE products (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  -- Postgres no tiene `rowid`, que era con lo que se ordenaba el catálogo para
  -- respetar el orden de carga. Esto lo reemplaza de forma explícita.
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE TABLE days (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  PRIMARY KEY (tenant_id, id)
);

-- Solo puede haber un día abierto por cliente a la vez. Antes esto se sostenía
-- por convención en dayService; acá lo garantiza la base.
CREATE UNIQUE INDEX idx_days_un_solo_abierto ON days(tenant_id) WHERE status = 'open';

-- `phone` era la clave primaria global: dos clientes distintos con el mismo
-- comprador colisionaban de frente. Ahora la clave es (tenant_id, phone), que
-- es lo que ese número significa de verdad: un contacto *de ese negocio*.
CREATE TABLE conversations (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram')),
  customer TEXT NOT NULL,
  lifecycle TEXT NOT NULL DEFAULT 'nuevo',
  agent TEXT NOT NULL DEFAULT 'recepcion',
  assignee TEXT,
  ai_draft TEXT,
  ai_draft_created_at TEXT,
  ai_draft_category TEXT,
  away_sent_at TEXT,
  -- Último entrante del cliente. Es lo que abre la ventana de servicio de 24h
  -- de WhatsApp: pasada esa ventana, Meta rechaza el texto libre y hay que
  -- mandar una plantilla aprobada. Hasta ahora no se guardaba porque el CRM
  -- asumía que siempre responde en el momento — y deja de ser cierto en cuanto
  -- un borrador queda pendiente y se contesta al día siguiente.
  last_inbound_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, phone)
);

CREATE TABLE messages (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  phone TEXT NOT NULL,
  customer TEXT NOT NULL,
  text TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out', 'nota', 'evento')),
  type TEXT CHECK (type IN ('automatico', 'pendiente')),
  status TEXT CHECK (status IN ('pendiente', 'resuelto')),
  author TEXT CHECK (author IN ('bot', 'admin')),
  agent_key TEXT,
  external_id TEXT,
  day_id TEXT NOT NULL,
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
  delivery_error TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  -- Las foráneas también van compuestas: así un mensaje no puede colgar de una
  -- conversación o un día de otro cliente ni por error de código.
  FOREIGN KEY (tenant_id, phone) REFERENCES conversations(tenant_id, phone) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, day_id) REFERENCES days(tenant_id, id)
);

CREATE INDEX idx_messages_day ON messages(tenant_id, day_id);
CREATE INDEX idx_messages_phone ON messages(tenant_id, phone);
CREATE INDEX idx_messages_agent ON messages(tenant_id, agent_key);

-- El wamid de Meta es único a nivel global, pero el índice se scopea igual:
-- si mañana dos clientes comparten número (portación, pruebas), un id repetido
-- rompería el guardado de uno de los dos en vez de convivir.
CREATE UNIQUE INDEX idx_messages_external_id
  ON messages(tenant_id, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE agents (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🤖',
  -- Cuándo tiene que tomar la conversación. Es lo único del agente que ve el
  -- ruteador, así que se escribe pensando en "en qué casos entra este".
  role TEXT NOT NULL DEFAULT '',
  -- Cómo redacta una vez que la tomó: tono, límites, qué puede prometer.
  instructions TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  -- Techo por agente para el envío automático: aunque el modelo diga que la
  -- respuesta es segura, si el agente tiene auto_send en 0 queda como borrador.
  auto_send INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  -- La key es única dentro del cliente, no del sistema: cada negocio arma sus
  -- propios agentes y dos pueden tener uno llamado 'ventas'.
  UNIQUE (tenant_id, key)
);

-- `shortcut` se guarda sin la barra: la "/" es de la UI, no del dato.
CREATE TABLE quick_replies (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  shortcut TEXT NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, shortcut)
);

-- Etiquetas libres por conversación, como las de WhatsApp Business. Es distinto
-- de `lifecycle`, que es una sola y describe en qué etapa va la venta: acá una
-- conversación puede ser "mayorista" y "debe seña" al mismo tiempo.
CREATE TABLE conversation_tags (
  tenant_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, phone, tag),
  FOREIGN KEY (tenant_id, phone) REFERENCES conversations(tenant_id, phone) ON DELETE CASCADE
);

CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tenant_id, tag);

-- Deduplicación de entregas repetidas del webhook. El id es el wamid de Meta,
-- único a nivel global, así que la clave no lleva tenant — pero la columna sí
-- está para poder purgar por cliente al dar de baja una cuenta.
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  received_at TEXT NOT NULL
);

CREATE INDEX idx_webhook_events_tenant ON webhook_events(tenant_id);
