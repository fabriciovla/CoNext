-- Con qué idioma de la página se postuló (es/en): decide en qué idioma sale
-- el correo de agradecimiento, y sirve para saber después con qué idioma
-- contestarle si el contacto es un WhatsApp y no un correo.
ALTER TABLE postulaciones ADD COLUMN idioma TEXT NOT NULL DEFAULT 'es';
