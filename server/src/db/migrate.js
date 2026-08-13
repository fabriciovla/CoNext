import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { query, tx } from './index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const { rows } = await query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.name))
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')

    // Cada migración va en su propia transacción: Postgres aborta la
    // transacción entera al primer error, así que una migración a medio aplicar
    // no puede quedar registrada como aplicada.
    await tx(async (client) => {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)', [
        file,
        new Date().toISOString(),
      ])
    })
    console.log(`[db] applied migration ${file}`)
  }
}
