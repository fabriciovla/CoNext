-- La zona horaria del negocio.
--
-- Los horarios de atención se evaluaban con la hora local del server
-- (`Date#getDay()` y `getHours()`). En desarrollo eso funciona por accidente,
-- porque la máquina está en hora argentina; publicado en Railway el contenedor
-- corre en UTC y el negocio queda tres horas corrido.
--
-- Y el problema no es solo el corrimiento: a las 21:00 de Argentina ya es el
-- día siguiente en UTC. Con sábado y domingo cerrados, todos los viernes a
-- partir de las 21 el server creía que era sábado y respondía que estaba
-- cerrado — en pleno horario de venta, y sin que nada lo dijera.
--
-- Por defecto Argentina, que es donde están los clientes. Es por negocio y no
-- una variable global del server porque un cliente en otra provincia con otro
-- huso, o en otro país, no puede depender de cómo esté configurado el contenedor.
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';
