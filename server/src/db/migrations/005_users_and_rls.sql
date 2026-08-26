-- Usuarios del dashboard y pertenencia a un cliente.
--
-- Hasta acá el CRM tenía clientes (`tenants`) pero no personas: una sola API
-- key por negocio y el "admin" era un string en el frontend. En Supabase las
-- personas viven en `auth.users` (login, contraseña, sesión). Esta migración
-- agrega la capa de negocio encima:
--
--   auth.users  →  public.users  →  tenant_members  →  tenants
--                      (perfil)         (rol)           (el negocio)
--
-- Un usuario puede estar en más de un cliente (un dueño con dos locales). Un
-- cliente tiene varias personas. Los datos de negocio siguen yendo por
-- `tenant_id`; lo que cambia es *quién* puede ver ese tenant.
--
-- RLS: las políticas miran `auth.uid()` y dejan pasar solo las filas de los
-- clientes donde esa persona es miembro. El server de Express se conecta con
-- el rol `postgres` / `service_role`, que se salta RLS — hace falta, porque el
-- webhook de Meta no trae un usuario logueado. Lo que RLS cubre es el acceso
-- directo desde el dashboard (la anon/authenticated key de Supabase).

-- En Postgres puro (Neon, local) no existe el esquema `auth`. Lo inventamos
-- con un `uid()` que devuelve null, así las políticas de abajo compilán y el
-- server sigue igual: no hay JWT, no hay filas visibles por RLS, y el rol
-- superusuario se las salta de todos modos. En Supabase el esquema ya está y
-- no se toca.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    EXECUTE 'CREATE SCHEMA auth';
    EXECUTE 'CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$ SELECT NULL::uuid $fn$';
  END IF;
END
$$;

-- Roles de Supabase. En Postgres puro no existen: los creamos vacíos para que
-- las políticas compilén. Si no hay permiso, las políticas van sin `TO` y los
-- GRANT se saltean — el server, dueño de las tablas, se salta RLS igual.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'sin permiso para crear roles anon/authenticated';
END
$$;

-- Perfil de una persona. El id es el mismo que `auth.users.id` cuando el alta
-- viene de Supabase Auth (el trigger de más abajo los mantiene enganchados).
-- Si todavía no hay cuenta de Auth — una invitación por mail, un alta a mano —
-- el id es un uuid nuestro y se reconcilia después por el email.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unico UNIQUE (email)
);

-- El email se compara en minúscula: "Ana@x.com" y "ana@x.com" son la misma
-- persona. El UNIQUE de arriba no alcanza porque Postgres distingue mayúsculas
-- en un índice normal.
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));

-- Quién trabaja en qué negocio. `role` no es el agente de IA: es el permiso
-- de la persona en el dashboard.
--
--   owner     — el que abrió la cuenta; puede borrar el cliente e invitar
--   admin     — configura, ve métricas, invita operadores
--   operador  — atiende la bandeja; no toca agentes ni facturación
CREATE TABLE tenant_members (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- ON UPDATE CASCADE: si Auth crea la cuenta después y hay que reemplazar el
  -- uuid provisional por el de `auth.users`, las membresías siguen al perfil.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'operador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_user ON tenant_members (user_id);

-- Invitación pendiente: la persona todavía no tiene fila en `users` (no se
-- registró). Cuando Auth crea la cuenta, el trigger consume estas filas y
-- arma la membresía. El UNIQUE va por email en minúscula, igual que users.
CREATE TABLE tenant_invites (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'operador')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, email)
);

CREATE UNIQUE INDEX idx_tenant_invites_email ON tenant_invites (tenant_id, lower(email));

-- Los clientes de los que esta sesión es miembro. SECURITY DEFINER para que
-- pueda leer `tenant_members` aunque esa tabla también tenga RLS — si no, la
-- política se llama a sí misma. `search_path` fijo para que nadie cuelgue una
-- función homónima en otro esquema y se ejecute con nuestros privilegios.
CREATE OR REPLACE FUNCTION user_tenant_ids()
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION user_tenant_ids() FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION user_tenant_ids() TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION user_tenant_ids() TO anon';
  END IF;
END
$$;

-- Alta desde Supabase Auth: copia el usuario a `public.users` y convierte en
-- membresía cualquier invitación que estuviera esperándolo. Solo se instala
-- si `auth.users` existe de verdad (en Neon el stub de arriba no tiene tabla).
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nombre TEXT;
BEGIN
  nombre := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO users (id, email, display_name)
  VALUES (NEW.id, lower(NEW.email), nombre)
  ON CONFLICT (email) DO UPDATE
    SET id = EXCLUDED.id,
        display_name = COALESCE(NULLIF(users.display_name, ''), EXCLUDED.display_name),
        updated_at = now();

  INSERT INTO tenant_members (tenant_id, user_id, role)
  SELECT i.tenant_id, NEW.id, i.role
  FROM tenant_invites i
  WHERE lower(i.email) = lower(NEW.email)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  DELETE FROM tenant_invites WHERE lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE 'CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE handle_new_auth_user()';
  END IF;
END
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- El dueño de las tablas (el server) se salta RLS. Estas políticas aplican
-- al resto de roles — en Supabase, a `authenticated` después de los GRANT.
CREATE POLICY users_select ON users
  FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT m2.user_id
      FROM tenant_members m1
      JOIN tenant_members m2 ON m1.tenant_id = m2.tenant_id
      WHERE m1.user_id = auth.uid()
    )
  );

CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY members_select ON tenant_members
  FOR SELECT
  USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY members_write ON tenant_members
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY invites_all ON tenant_invites
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

-- Los secretos (api_key_hash, access_token) no se GRANT-ean a authenticated,
-- así que esta política puede ser amplia: esas columnas no salen por PostgREST.
CREATE POLICY tenants_select ON tenants
  FOR SELECT
  USING (id IN (SELECT user_tenant_ids()));

CREATE POLICY tenants_update ON tenants
  FOR UPDATE
  USING (id IN (SELECT user_tenant_ids()))
  WITH CHECK (id IN (SELECT user_tenant_ids()));

CREATE POLICY settings_all ON settings
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY products_all ON products
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY product_folders_all ON product_folders
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY days_all ON days
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY conversations_all ON conversations
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY messages_all ON messages
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY agents_all ON agents
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY quick_replies_all ON quick_replies
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY conversation_tags_all ON conversation_tags
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

-- El webhook es del server, no de la dashboard. Sin GRANT a authenticated.
CREATE POLICY webhook_events_none ON webhook_events
  FOR ALL
  USING (false);

-- PostgREST (el Data API de Supabase) habla con `authenticated`. Sin estos
-- GRANT las políticas no se evalúan: la request muere en permission denied.
-- `anon` no recibe nada a propósito. Si el rol no existe, no hay nada que dar.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RETURN;
  END IF;

  EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated';
  EXECUTE 'GRANT SELECT, UPDATE ON users TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_members TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_invites TO authenticated';
  EXECUTE 'GRANT SELECT (id, name, slug, status, waba_id, phone_number_id, connected_at, created_at, updated_at) ON tenants TO authenticated';
  EXECUTE 'GRANT UPDATE (name, slug, updated_at) ON tenants TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON product_folders TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON days TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON agents TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON quick_replies TO authenticated';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_tags TO authenticated';
END
$$;
