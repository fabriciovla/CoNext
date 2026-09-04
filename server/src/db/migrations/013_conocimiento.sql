-- Entrenamiento de los agentes: los documentos, enlaces y textos con los que
-- contestan cosas que no están ni en el catálogo ni en los horarios.
--
-- Hasta acá lo único que sabía un agente era lo que entraba en su `role` y sus
-- `instructions`: dos campos de texto que se escriben a mano y que se leen
-- enteros en cada llamada al modelo. Una política de cambios, un instructivo de
-- garantía o las preguntas frecuentes de un negocio no entran ahí — y pegadas
-- adentro de "instrucciones" se mezclan con el tono, que es otra cosa.
--
-- Son DOS tablas y no una a propósito. Las fuentes son del negocio (un PDF de
-- garantías lo usan el agente de ventas y el de posventa), pero cuál de ellas
-- mira cada agente es del agente: sin la tabla del medio, cargar un documento
-- obligaría a subirlo una vez por agente y a mantener N copias del mismo texto.
CREATE TABLE knowledge_sources (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,

  -- De dónde salió el texto. Cambia qué se muestra abajo del título y nada
  -- más: para el modelo las tres son lo mismo, un bloque de texto con nombre.
  kind TEXT NOT NULL CHECK (kind IN ('archivo', 'enlace', 'texto')),
  title TEXT NOT NULL,
  -- El nombre del archivo o la URL. En 'texto' queda vacío: no vino de ningún
  -- lado, lo escribió una persona en la pantalla.
  origin TEXT NOT NULL DEFAULT '',

  -- El texto ya extraído, no el binario. El PDF original no se guarda: lo único
  -- que viaja al modelo es esto, y guardar el archivo entero sería sostener en
  -- disco una copia que nadie vuelve a abrir. Si el documento cambia, se sube
  -- de nuevo — que es también la única forma de que el texto se actualice.
  content TEXT NOT NULL,
  -- Cuánto ocupa, para poder mostrarlo sin traer el contenido en la lista.
  chars INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

CREATE INDEX knowledge_sources_created ON knowledge_sources (tenant_id, created_at DESC);

-- Qué fuente mira qué agente. La fila existe = está encendida para ese agente;
-- apagarla es borrarla. No hay columna `enabled` porque no hay tercer estado:
-- una fuente que un agente no usa no necesita quedar registrada.
--
-- El FK compuesto lleva el tenant adelante igual que en `messages`: sin él, un
-- agente de un cliente podría quedar apuntando a la fuente de otro.
CREATE TABLE agent_knowledge (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, agent_id, source_id),
  FOREIGN KEY (tenant_id, agent_id) REFERENCES agents(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, source_id) REFERENCES knowledge_sources(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX agent_knowledge_por_fuente ON agent_knowledge (tenant_id, source_id);

-- Mismo criterio que el resto: el server se salta RLS (se conecta como dueño),
-- pero cualquier acceso directo desde el dashboard ve solo lo de sus clientes.
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_sources_all ON knowledge_sources
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY agent_knowledge_all ON agent_knowledge
  FOR ALL
  USING (tenant_id IN (SELECT user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

-- Los GRANT del 005 se hicieron tabla por tabla; estas dos son nuevas y hay que
-- sumarlas. Solo si el rol existe: en Postgres puro (Neon, local) los roles de
-- Supabase no están y el server, dueño de las tablas, se salta RLS igual.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge_sources, agent_knowledge TO authenticated';
  END IF;
END
$$;
