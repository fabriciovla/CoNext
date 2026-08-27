import pg from 'pg'

const { Pool } = pg

// SQLite quedó atrás al pasar a multi-cliente: era un archivo único y una API
// síncrona, o sea un solo proceso escribiendo. Con varios negocios en la misma
// instancia eso es el techo antes que cualquier otra cosa.
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'Falta DATABASE_URL en el .env. Es la cadena de conexión de Postgres\n' +
      '(ej: postgresql://usuario:clave@host/base?sslmode=require).',
  )
}

// Las Postgres hospedadas (Neon, Supabase, Railway) exigen TLS pero presentan
// certificados que no encadenan contra el store del sistema en Windows. Local
// va sin TLS, así que se decide por la cadena y no por NODE_ENV: en desarrollo
// también se apunta a la base hospedada.
const usaSsl = /\bsslmode=require\b/.test(connectionString) || /\.neon\.tech|\.supabase\.co/.test(connectionString)

// Desde pg 8.16 el `sslmode` de la cadena manda sobre la opción `ssl`, y
// `require` pasó a verificar la cadena de certificados (libpq nunca lo hizo).
// Contra el pooler de Supabase eso corta el arranque con
// SELF_SIGNED_CERT_IN_CHAIN: `migrate()` explota, el server no llega a
// escuchar y la dashboard queda tirando errores en todas las requests. Se le
// saca el parámetro a la cadena y el TLS lo decide `usaSsl`, que es donde ya
// estaba decidido.
const cadena = usaSsl ? connectionString.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '') : connectionString

const pool = new Pool({
  connectionString: cadena,
  ssl: usaSsl ? { rejectUnauthorized: false } : false,
})

// Un error en un cliente ocioso del pool (la base cerró la conexión, se cayó la
// red) llega como evento suelto: sin este handler, Node lo trata como excepción
// no capturada y se lleva puesto el proceso entero.
pool.on('error', (err) => {
  console.error('[db] error en un cliente ocioso del pool:', err)
})

// Todas las consultas pasan por acá. `params` usa los placeholders posicionales
// de Postgres ($1, $2, …), no los '?' de SQLite.
export async function query(sql, params = []) {
  return pool.query(sql, params)
}

// Una sola fila o undefined. Equivale al .get() que traía node:sqlite.
export async function one(sql, params = []) {
  const { rows } = await pool.query(sql, params)
  return rows[0]
}

// Todas las filas. Equivale al .all().
export async function many(sql, params = []) {
  const { rows } = await pool.query(sql, params)
  return rows
}

// Para INSERT/UPDATE/DELETE: devuelve cuántas filas se tocaron. Se usa igual que
// el `changes` de node:sqlite, del que dependen las reservas atómicas (por
// ejemplo el aviso de ausencia, que se apoya en que solo un UPDATE gane).
export async function run(sql, params = []) {
  const { rowCount } = await pool.query(sql, params)
  return rowCount
}

// Transacción sobre una única conexión del pool. Hace falta tomar el cliente a
// mano: con pool.query() cada sentencia puede salir por una conexión distinta y
// el BEGIN no envolvería nada.
export async function tx(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function closePool() {
  await pool.end()
}

export default { query, one, many, run, tx, closePool }
