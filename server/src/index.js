import 'dotenv/config'
import { migrate } from './db/migrate.js'
import { createApp } from './app.js'

// `ensureInitialDay` salió de acá: abrir el día es por cliente, no del server.
// Ahora lo hace provisionTenant en el alta de cada uno.
await migrate()

const app = createApp()
const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
