-- Los agentes dejan de ser tres etiquetas fijas del frontend y pasan a ser
-- configurables: cada uno tiene su propio criterio de entrada (`role`, que es
-- lo que lee el ruteador) y sus propias instrucciones de redacción.
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
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
  updated_at TEXT NOT NULL
);

INSERT INTO agents (id, key, name, emoji, role, instructions, enabled, auto_send, position, created_at, updated_at)
VALUES
  (
    'agent-recepcion', 'recepcion', 'Recepcionista', '🤖',
    'Primer contacto y consultas generales: saludos, horarios, ubicación, medios de pago, "¿están?", agradecimientos y cualquier mensaje que todavía no se sabe a dónde va.',
    'Sé breve y cálido. Respondé la consulta y, si el cliente todavía no dijo qué busca, preguntale en una línea en qué lo podés ayudar.',
    1, 1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    'agent-ventas', 'ventas', 'Agente de ventas', '💼',
    'Consultas de compra: precio, stock, talles, colores, disponibilidad, comparaciones entre productos e intención explícita de comprar.',
    'Respondé con el precio y el stock exactos del catálogo. Si el producto está sin stock, decilo y ofrecé una alternativa del catálogo. No negocies descuentos ni prometas reservas.',
    1, 1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    'agent-soporte', 'soporte', 'Agente de soporte', '🎧',
    'Posventa y problemas: estado del pedido, demoras, reclamos, cambios, devoluciones, problemas de pago y clientes molestos.',
    'Reconocé el problema antes de responder. Nunca confirmes reintegros, cancelaciones ni cambios por tu cuenta: eso lo resuelve el equipo, así que dejá la respuesta como borrador pendiente.',
    1, 0, 2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );

-- Qué agente atendió cada mensaje. Va en `messages` y no solo en
-- `conversations` porque una conversación puede pasar de un agente a otro
-- (venta que termina en reclamo) y las métricas por agente tienen que
-- seguir contando bien lo que atendió cada uno.
ALTER TABLE messages ADD COLUMN agent_key TEXT;
CREATE INDEX idx_messages_agent ON messages(agent_key);
