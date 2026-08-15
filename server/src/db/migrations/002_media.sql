-- Adjuntos que salen del composer: imágenes, audios, videos y documentos.
--
-- El archivo no vive en la base: se guarda en el disco del server, bajo
-- uploads/<tenant_id>/, y acá queda solo la referencia. La ruta es relativa a
-- esa carpeta a propósito — mover la carpeta o el server de máquina no obliga a
-- reescribir filas — y nunca sale hacia el frontend: la dashboard pide el
-- archivo por el id del mensaje (GET /messages/media/:id), que es lo único que
-- se puede scopear por tenant.
--
-- `text` sigue siendo NOT NULL: un adjunto sin epígrafe guarda '' y el pie de
-- la burbuja lo resuelve la UI, que ya sabe si hay media.
ALTER TABLE messages ADD COLUMN media_kind TEXT
  CHECK (media_kind IN ('image', 'audio', 'video', 'document'));
ALTER TABLE messages ADD COLUMN media_path TEXT;
ALTER TABLE messages ADD COLUMN media_mime TEXT;
ALTER TABLE messages ADD COLUMN media_name TEXT;
ALTER TABLE messages ADD COLUMN media_size INTEGER;
