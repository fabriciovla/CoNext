-- Carpetas del catálogo.
--
-- Con veinte productos la lista plana alcanza; con doscientos deja de ser un
-- catálogo y pasa a ser una pila. La carpeta es la unidad con la que el admin
-- agrupa lo que vende ("Bebidas", "Panificados") y también lo que le da
-- contexto al modelo: el catálogo entra al prompt agrupado, así "¿qué bebidas
-- tienen?" se puede contestar sin que el modelo adivine qué es una bebida.

CREATE TABLE product_folders (
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  -- Mismo criterio que products: el orden de la columna es el de carga, y sin
  -- rowid de SQLite hay que guardarlo explícito.
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, id)
);

-- Dos carpetas con el mismo nombre dentro del mismo negocio no significan nada
-- distinto: el producto termina en cualquiera de las dos y el admin ve dos
-- filas iguales en la columna. Entre negocios distintos, en cambio, "Bebidas"
-- se repite siempre — por eso el tenant va adelante, como en todo el esquema.
-- `lower(name)` porque "Bebidas" y "bebidas" son la misma carpeta escrita dos
-- veces.
CREATE UNIQUE INDEX idx_product_folders_nombre ON product_folders (tenant_id, lower(name));

-- Un producto está en una carpeta o en ninguna. NULL es "Sin carpeta", que en
-- la dashboard se ve como una carpeta más pero acá no existe como fila: es el
-- estado en el que nace todo producto y al que vuelven los de una carpeta que
-- se borra.
--
-- Una sola carpeta por producto y no varias: una tabla de cruce serviría para
-- etiquetas, no para carpetas — el sentido de una carpeta es justamente que la
-- cosa está en un solo lugar y se sabe cuál.
ALTER TABLE products ADD COLUMN folder_id TEXT;

-- La foránea va compuesta, con el tenant adelante: es lo que impide que un
-- producto de un negocio apunte a la carpeta de otro. Con folder_id en NULL la
-- restricción no se evalúa (MATCH SIMPLE), que es lo que queremos para los
-- productos sueltos.
--
-- Y va sin ON DELETE a propósito. CASCADE se llevaría los productos, y borrar
-- la carpeta "Bebidas" no es borrar las bebidas. SET NULL, en una foránea
-- compuesta, anula *todas* las columnas de la clave — tenant_id incluido —, y
-- limitarlo a una sola recién se puede desde Postgres 15. El borrado lo hace
-- deleteFolder en una transacción: primero saca los productos de la carpeta,
-- después la borra. Si alguien intentara borrarla sin eso, la foránea lo
-- rechaza en vez de dejar filas colgando.
ALTER TABLE products
  ADD CONSTRAINT products_folder_fkey
  FOREIGN KEY (tenant_id, folder_id) REFERENCES product_folders (tenant_id, id);
