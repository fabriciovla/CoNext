-- El correo con el que se contestó el cuestionario de /empezar.
--
-- `altas` nació anónima (ver 006) porque quien contesta todavía no es cliente,
-- y el "esta persona ya contestó" vivía en el localStorage del navegador del
-- sitio. Eso tenía dos agujeros: la encuesta se repetía en cada máquina y en
-- incógnito, y no saltaba nunca al entrar con una cuenta nueva, porque el login
-- no tenía a quién preguntarle. El correo es lo único que las dos puntas
-- comparten —lo escribe quien entra, lo devuelve el proveedor social—, así que
-- es lo que engancha el alta con la cuenta.
--
-- Sin UNIQUE a propósito: la misma persona puede comprar dos veces, y una
-- segunda alta es un dato más y no un conflicto. El corte del login pregunta si
-- hay alguna, no cuál.
ALTER TABLE altas ADD COLUMN correo TEXT;

CREATE INDEX altas_correo ON altas (correo);
