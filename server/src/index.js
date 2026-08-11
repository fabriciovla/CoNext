import 'dotenv/config'
import { migrate } from './db/migrate.js'
import { ensureInitialDay } from './services/dayService.js'
import { createApp } from './app.js'

migrate()
ensureInitialDay()

const app = createApp()
const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
  if (!process.env.API_KEY) {
    console.warn(
      '[server] ATENCIÓN: sin API_KEY en el .env, la API queda abierta a cualquiera que\n' +
        '         alcance este puerto — incluido todo internet mientras haya un túnel activo.',
    )
  }
})
