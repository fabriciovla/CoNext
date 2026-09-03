-- El idioma en el que la IA le escribe al cliente.
--
-- Hasta acá el idioma estaba clavado adentro del prompt: `systemPrompt.js` está
-- escrito en español y pide un "tono cercano, argentino", así que un negocio
-- que atiende en inglés o en portugués no tenía forma de pedirlo. No es lo
-- mismo que el idioma de la dashboard, que es una preferencia de quien mira la
-- pantalla y vive en el navegador: esto lo recibe el cliente por WhatsApp y es
-- del negocio, así que va en la base y no en localStorage.
--
-- 'es' por defecto y no 'auto' a propósito: es lo que ya hacían todos los
-- tenants creados, y una migración no es el lugar para cambiarle a nadie cómo
-- le contesta el bot a sus clientes.
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS ai_language TEXT NOT NULL DEFAULT 'es';
