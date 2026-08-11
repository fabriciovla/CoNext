CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  days_open TEXT NOT NULL,
  welcome_message TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL
);

CREATE TABLE days (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

-- `phone` is the sole identifier the frontend deals with today (matches
-- mockData.js). `channel` is tracked for the Meta adapters but WhatsApp
-- numbers and Instagram IGSIDs don't collide in practice, so it isn't part
-- of the key.
CREATE TABLE conversations (
  phone TEXT PRIMARY KEY,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram')),
  customer TEXT NOT NULL,
  lifecycle TEXT NOT NULL DEFAULT 'nuevo',
  agent TEXT NOT NULL DEFAULT 'recepcion',
  assignee TEXT,
  ai_draft TEXT,
  ai_draft_created_at TEXT,
  ai_draft_category TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL REFERENCES conversations(phone),
  customer TEXT NOT NULL,
  text TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out', 'nota', 'evento')),
  type TEXT CHECK (type IN ('automatico', 'pendiente')),
  status TEXT CHECK (status IN ('pendiente', 'resuelto')),
  author TEXT CHECK (author IN ('bot', 'admin')),
  external_id TEXT,
  day_id TEXT NOT NULL REFERENCES days(id),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_messages_day ON messages(day_id);
CREATE INDEX idx_messages_phone ON messages(phone);
CREATE UNIQUE INDEX idx_messages_external_id ON messages(external_id) WHERE external_id IS NOT NULL;

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);
