-- Respuestas rápidas, el equivalente a las de WhatsApp Business: textos que se
-- repiten todo el día (envíos, medios de pago, ubicación) y que hoy hay que
-- volver a tipear en cada conversación.
--
-- `shortcut` se guarda sin la barra: la "/" es de la UI, no del dato.
CREATE TABLE quick_replies (
  id TEXT PRIMARY KEY,
  shortcut TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO quick_replies (id, shortcut, text, position, created_at, updated_at)
VALUES
  (
    'qr-envios', 'envios',
    'Hacemos envíos a todo el país por correo. El costo depende de la zona y te lo confirmamos antes de despachar 📦',
    0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    'qr-pago', 'pago',
    'Podés pagar por transferencia, efectivo o tarjeta. Si transferís, mandanos el comprobante y preparamos el pedido 😊',
    1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    'qr-gracias', 'gracias',
    '¡Gracias por tu compra! Cualquier cosa que necesites, escribinos por acá 🙌',
    2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );
