-- Equivalente al "mensaje de ausencia" de WhatsApp Business: lo que se
-- contesta cuando alguien escribe fuera de los días/horarios de atención.
-- Hasta ahora el horario estaba en el prompt como dato, pero nada impedía que
-- el bot respondiera a las 4 de la mañana como si el local estuviera abierto.
ALTER TABLE settings ADD COLUMN away_message TEXT NOT NULL
  DEFAULT '¡Hola! Ahora estamos cerrados. Te respondemos apenas abramos 😊';

-- Cuándo se le mandó el último aviso de "estamos cerrados" a esta conversación.
-- Sirve para no repetirlo en cada mensaje: si el cliente escribe cinco veces
-- seguidas un domingo, recibe un solo aviso.
ALTER TABLE conversations ADD COLUMN away_sent_at TEXT;
