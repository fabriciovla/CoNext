-- Etiquetas libres por conversación, como las de WhatsApp Business. Es distinto
-- de `lifecycle`, que es una sola y describe en qué etapa va la venta: acá una
-- conversación puede ser "mayorista" y "debe seña" al mismo tiempo.
--
-- Tabla aparte y no una columna JSON en `conversations` porque lo que más se
-- hace con esto es filtrar por etiqueta, y así el índice trabaja de verdad.
CREATE TABLE conversation_tags (
  phone TEXT NOT NULL REFERENCES conversations(phone) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (phone, tag)
);

CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tag);
