-- Estado de entrega de los mensajes que mandamos. Meta ya nos manda estos
-- eventos al mismo webhook (sent -> delivered -> read, o failed con el motivo)
-- y hasta ahora se descartaban, así que la bandeja no tenía forma de saber si
-- lo que salió llegó de verdad.
--
-- NULL = todavía sin novedades. 'failed' es el que importa: es el caso en el
-- que el cliente nunca recibió la respuesta y hoy no se entera nadie.
ALTER TABLE messages ADD COLUMN delivery_status TEXT
  CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed'));

-- El motivo del fallo tal como lo manda Meta, para poder mostrarlo sin tener
-- que ir a buscar el log del server.
ALTER TABLE messages ADD COLUMN delivery_error TEXT;
