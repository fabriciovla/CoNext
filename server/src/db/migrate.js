import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name))
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

  const markApplied = db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)')

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    db.exec('BEGIN')
    try {
      db.exec(sql)
      markApplied.run(file, new Date().toISOString())
      db.exec('COMMIT')
      console.log(`[db] applied migration ${file}`)
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }
}
