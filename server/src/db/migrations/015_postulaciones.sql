-- Postulaciones de la sección "Postulate en conext" de la landing. Como
-- `altas`, vive fuera del recinto multi-tenant: quien postula todavía no es
-- cliente, así que no hay tenant_id que ponerle.

CREATE TABLE postulaciones (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  negocio TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX postulaciones_created_at ON postulaciones (created_at DESC);
