import crypto from 'node:crypto'
import { one, many, run } from '../db/index.js'

const COLUMNS = 'id, name, price, stock'

export async function getProducts(tenantId) {
  return many(`SELECT ${COLUMNS} FROM products WHERE tenant_id = $1 ORDER BY created_at ASC`, [tenantId])
}

export async function addProduct(tenantId, { name, price, stock }) {
  // Era `p${Date.now()}`: dos productos cargados en el mismo milisegundo
  // colisionaban, y con varios clientes en la misma instancia eso deja de ser
  // hipotético. La clave es (tenant_id, id), pero el id igual conviene único.
  const id = `p-${crypto.randomUUID()}`
  await run(
    'INSERT INTO products (tenant_id, id, name, price, stock, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [tenantId, id, name, price, stock, new Date().toISOString()],
  )
  return one(`SELECT ${COLUMNS} FROM products WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
}

export async function updateProduct(tenantId, id, changes) {
  const current = await one(`SELECT ${COLUMNS} FROM products WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
  if (!current) return null

  const next = { ...current, ...changes }
  await run('UPDATE products SET name = $1, price = $2, stock = $3 WHERE tenant_id = $4 AND id = $5', [
    next.name,
    next.price,
    next.stock,
    tenantId,
    id,
  ])
  return one(`SELECT ${COLUMNS} FROM products WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
}

export async function deleteProduct(tenantId, id) {
  await run('DELETE FROM products WHERE tenant_id = $1 AND id = $2', [tenantId, id])
}
