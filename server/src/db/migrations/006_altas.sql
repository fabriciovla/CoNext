-- Altas del cuestionario post-compra. No lleva tenant_id a propósito: la
-- persona todavía no es un cliente del CRM (el tenant se provisiona después,
-- a mano o cuando el pago de Dodo cierre el círculo). Es el mismo tipo de
-- excepción que /webhooks: vive fuera del recinto multi-tenant.
--
-- Las columnas sueltas (origen, rubro, equipo, nombre, negocio) son para
-- filtrar sin abrir el JSON. `respuestas` guarda el objeto entero, incluido
-- el texto de "Otro".

CREATE TABLE altas (
  id TEXT PRIMARY KEY,
  plan TEXT NOT NULL CHECK (plan IN ('gratis', 'estandar', 'premium')),
  origen TEXT,
  rubro TEXT,
  equipo TEXT,
  nombre TEXT,
  negocio TEXT,
  respuestas JSONB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX altas_created_at ON altas (created_at DESC);
CREATE INDEX altas_plan ON altas (plan);
