-- Horario independiente por día. Se guarda como un objeto JSON con las mismas
-- etiquetas que usa la UI (`Lun` … `Dom`); un día en null está cerrado:
--
--   {"Lun":{"openTime":"09:00","closeTime":"18:00"},"Dom":null}
--
-- Las columnas viejas se conservan por compatibilidad con instalaciones y
-- clientes anteriores. El servicio arma este objeto desde ellas la primera vez
-- y las sigue sincronizando al guardar.

ALTER TABLE settings ADD COLUMN weekly_hours TEXT NOT NULL DEFAULT '{}';
