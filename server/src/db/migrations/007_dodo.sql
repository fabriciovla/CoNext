-- Eventos de Dodo Payments. Como `altas`, no lleva tenant_id a propósito: el
-- pago llega *antes* de que exista el cliente en el CRM, así que no hay a quién
-- atribuírselo todavía. Vive fuera del recinto multi-tenant, igual que /webhooks.
--
-- La clave primaria es el `webhook-id` de Dodo, y eso es lo que hace de dedup:
-- un INSERT … ON CONFLICT DO NOTHING que no toca ninguna fila es un reintento.
-- No usa `webhook_events` porque esa tabla referencia tenants(id) y acá el
-- tenant es justamente lo que falta.
--
-- Las columnas sueltas son para poder buscar sin abrir el JSON; `payload`
-- guarda el evento entero, que es la única copia que vamos a tener de lo que
-- Dodo dijo — el catálogo y los precios pueden cambiar después.

CREATE TABLE dodo_eventos (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  plan TEXT,
  email TEXT,
  nombre TEXT,
  customer_id TEXT,
  subscription_id TEXT,
  payment_id TEXT,
  product_id TEXT,
  estado TEXT,
  -- Null hasta que el evento se convierta en un cliente del CRM. Es lo que
  -- distingue lo que falta procesar de lo que ya se dio de alta.
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  procesado_at TEXT,
  payload JSONB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX dodo_eventos_created_at ON dodo_eventos (created_at DESC);
CREATE INDEX dodo_eventos_subscription ON dodo_eventos (subscription_id);
CREATE INDEX dodo_eventos_email ON dodo_eventos (email);
-- Los que todavía no se convirtieron en tenant: es la cola de trabajo.
CREATE INDEX dodo_eventos_pendientes ON dodo_eventos (created_at DESC) WHERE tenant_id IS NULL;
