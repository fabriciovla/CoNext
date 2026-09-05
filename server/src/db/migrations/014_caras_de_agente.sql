-- La cara de un agente deja de ser un emoji del sistema.
--
-- La columna guardaba un emoji suelto y lo dibujaba la fuente del sistema
-- operativo de quien mirara la dashboard, así que el mismo agente tenía una
-- cara distinta en cada máquina del equipo. Ahora guarda la clave de uno de los
-- veinte dibujos de la marca (`src/components/ui/AgentAvatar.jsx`). La columna
-- sigue llamándose `emoji`: renombrarla es tocar la tabla, el servicio y las dos
-- pantallas para no cambiar nada de lo que pasa.
--
-- Se traducen **solo los tres emojis que sembraba el alta**, que son los que
-- pusimos nosotros y no eligió nadie. Una cara elegida a mano se deja como está:
-- la pantalla sigue dibujando un valor así como texto, y perder lo que alguien
-- eligió a propósito es peor que una lista despareja por un rato.
UPDATE agents SET emoji = 'recepcionista' WHERE emoji = '🤖';
UPDATE agents SET emoji = 'ventas'        WHERE emoji = '💼';
UPDATE agents SET emoji = 'soporte'       WHERE emoji = '🎧';

ALTER TABLE agents ALTER COLUMN emoji SET DEFAULT 'recepcionista';
