import db from '../db/index.js'

export function getProducts() {
  return db.prepare('SELECT id, name, price, stock FROM products ORDER BY rowid ASC').all()
}

export function addProduct({ name, price, stock }) {
  const id = `p${Date.now()}`
  db.prepare('INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)').run(id, name, price, stock)
  return db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(id)
}

export function updateProduct(id, changes) {
  const current = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(id)
  if (!current) return null
  const next = { ...current, ...changes }
  db.prepare('UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?').run(
    next.name,
    next.price,
    next.stock,
    id,
  )
  return db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(id)
}

export function deleteProduct(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
}
