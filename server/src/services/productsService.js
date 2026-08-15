import crypto from 'node:crypto'
import { one, many, run, tx } from '../db/index.js'

// El nombre de la carpeta viaja con el producto y no se resuelve del otro lado:
// lo necesitan tanto la dashboard (la etiqueta de la fila cuando se miran todos
// los productos juntos) como el prompt, que arma el catálogo agrupado. Es un
// LEFT JOIN, así que un producto sin carpeta sigue viniendo, con folderName en
// null.
//
// Los alias van entre comillas dobles: sin ellas Postgres los baja a minúscula
// y `folderId` llega vacío al frontend.
const COLUMNS = `p.id, p.name, p.price, p.stock, p.folder_id AS "folderId", f.name AS "folderName"`
const FROM = `FROM products p
     LEFT JOIN product_folders f ON f.tenant_id = p.tenant_id AND f.id = p.folder_id`

const FOLDER_COLUMNS = 'id, name'

function getProduct(tenantId, id) {
  return one(`SELECT ${COLUMNS} ${FROM} WHERE p.tenant_id = $1 AND p.id = $2`, [tenantId, id])
}

// Una carpeta que no es de este cliente no existe para este cliente: en vez de
// fallar el guardado por algo que el admin no puede arreglar, el producto queda
// sin carpeta. Es la misma regla que sostiene todo el resto del sistema, acá
// aplicada a lo que entra por el body. La foránea compuesta del esquema es el
// respaldo si esta comprobación se saltea alguna vez.
async function resolveFolderId(tenantId, folderId) {
  if (!folderId) return null
  const folder = await one('SELECT id FROM product_folders WHERE tenant_id = $1 AND id = $2', [
    tenantId,
    folderId,
  ])
  return folder ? folder.id : null
}

export async function getProducts(tenantId) {
  return many(`SELECT ${COLUMNS} ${FROM} WHERE p.tenant_id = $1 ORDER BY p.created_at ASC`, [tenantId])
}

export async function addProduct(tenantId, { name, price, stock, folderId = null }) {
  // Era `p${Date.now()}`: dos productos cargados en el mismo milisegundo
  // colisionaban, y con varios clientes en la misma instancia eso deja de ser
  // hipotético. La clave es (tenant_id, id), pero el id igual conviene único.
  const id = `p-${crypto.randomUUID()}`
  await run(
    `INSERT INTO products (tenant_id, id, name, price, stock, folder_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tenantId, id, name, price, stock, await resolveFolderId(tenantId, folderId), new Date().toISOString()],
  )
  return getProduct(tenantId, id)
}

export async function updateProduct(tenantId, id, changes) {
  const current = await getProduct(tenantId, id)
  if (!current) return null

  // `changes` puede traer folderId en null a propósito (sacar el producto de la
  // carpeta), y eso es distinto de no mandarlo: el spread respeta las dos cosas
  // porque mira si la clave está, no si tiene valor.
  const next = { ...current, ...changes }
  await run(
    `UPDATE products SET name = $1, price = $2, stock = $3, folder_id = $4
     WHERE tenant_id = $5 AND id = $6`,
    [
      next.name,
      next.price,
      next.stock,
      await resolveFolderId(tenantId, next.folderId),
      tenantId,
      id,
    ],
  )
  return getProduct(tenantId, id)
}

export async function deleteProduct(tenantId, id) {
  await run('DELETE FROM products WHERE tenant_id = $1 AND id = $2', [tenantId, id])
}

// ---------------------------------------------------------------------------
// Carpetas
//
// Viven en este servicio y no en uno propio porque no son una entidad aparte:
// existen para agrupar productos y borrar una toca la tabla de productos. La
// cantidad de productos de cada carpeta no se devuelve desde acá — la calcula
// la dashboard con la lista que ya tiene, así el número nunca discrepa de las
// filas que se están viendo (por ejemplo mientras un arrastre todavía no
// confirmó).
// ---------------------------------------------------------------------------

export async function getFolders(tenantId) {
  return many(
    `SELECT ${FOLDER_COLUMNS} FROM product_folders WHERE tenant_id = $1 ORDER BY created_at ASC`,
    [tenantId],
  )
}

function getFolder(tenantId, id) {
  return one(`SELECT ${FOLDER_COLUMNS} FROM product_folders WHERE tenant_id = $1 AND id = $2`, [
    tenantId,
    id,
  ])
}

// El nombre repetido se comprueba acá y no se deja explotar contra el índice
// único: así el router puede contestar "ya tenés una carpeta con ese nombre" en
// vez de un 500. El índice sigue siendo la garantía de que no pasa igual.
function findByName(tenantId, name, exceptId = null) {
  return one(
    `SELECT id FROM product_folders
      WHERE tenant_id = $1 AND lower(name) = lower($2) AND ($3::text IS NULL OR id <> $3)`,
    [tenantId, name, exceptId],
  )
}

// Devuelven { folder } o { error }: hay más de un motivo para no guardar y con
// un null pelado el router no podría distinguirlos.
export async function addFolder(tenantId, { name }) {
  const nombre = String(name ?? '').trim()
  if (!nombre) return { error: 'nombre-vacio' }
  if (await findByName(tenantId, nombre)) return { error: 'duplicada' }

  const id = `f-${crypto.randomUUID()}`
  await run(
    'INSERT INTO product_folders (tenant_id, id, name, created_at) VALUES ($1, $2, $3, $4)',
    [tenantId, id, nombre, new Date().toISOString()],
  )
  return { folder: await getFolder(tenantId, id) }
}

export async function updateFolder(tenantId, id, { name }) {
  const nombre = String(name ?? '').trim()
  if (!nombre) return { error: 'nombre-vacio' }
  if (!(await getFolder(tenantId, id))) return { error: 'not-found' }
  if (await findByName(tenantId, nombre, id)) return { error: 'duplicada' }

  await run('UPDATE product_folders SET name = $1 WHERE tenant_id = $2 AND id = $3', [
    nombre,
    tenantId,
    id,
  ])
  return { folder: await getFolder(tenantId, id) }
}

// Borrar la carpeta no borra lo que tiene adentro: los productos vuelven a
// quedar sueltos. Las dos escrituras van en una transacción porque la foránea
// no deja borrar una carpeta con productos apuntándole — que es justamente lo
// que impide que esto quede a medias y deje filas apuntando a una carpeta que
// ya no existe.
export async function deleteFolder(tenantId, id) {
  return tx(async (client) => {
    const { rowCount } = await client.query(
      'SELECT 1 FROM product_folders WHERE tenant_id = $1 AND id = $2',
      [tenantId, id],
    )
    if (rowCount === 0) return { deleted: false }

    await client.query('UPDATE products SET folder_id = NULL WHERE tenant_id = $1 AND folder_id = $2', [
      tenantId,
      id,
    ])
    await client.query('DELETE FROM product_folders WHERE tenant_id = $1 AND id = $2', [tenantId, id])
    return { deleted: true }
  })
}
