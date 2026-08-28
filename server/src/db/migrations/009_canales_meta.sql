-- Qué canales contesta el CRM, por cliente.
--
-- Instagram y Messenger se conectan de una sola vez y no hay forma de
-- separarlos: Meta entrega un único token que cubre la Página y la cuenta de
-- Instagram que cuelga de ella. Dos botones de "conectar" abrirían el mismo
-- popup, pedirían lo mismo y guardarían lo mismo — una elección falsa.
--
-- Lo que el negocio sí necesita elegir es **qué canales quiere que atendamos**.
-- Un local puede querer los DM de Instagram automatizados y que los mensajes de
-- su Página de Facebook —que quizá no mira nunca— le sigan llegando a Facebook
-- y nada más. Eso no es una conexión aparte: es un interruptor.
--
-- Arrancan en 1: quien acaba de conectar espera que funcione, no que haya que
-- ir a prender algo más para que entre el primer mensaje.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS instagram_activo INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS messenger_activo INTEGER NOT NULL DEFAULT 1;
