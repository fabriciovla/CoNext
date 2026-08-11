import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// La API key se lee del .env del server y la inyecta el proxy, que corre en
// Node. Si en cambio se pasara por import.meta.env, quedaría escrita en el
// bundle y cualquiera podría leerla desde el navegador.
function leerApiKey() {
  try {
    const env = fs.readFileSync(path.join(__dirname, 'server', '.env'), 'utf-8')
    return env.match(/^API_KEY=(.*)$/m)?.[1]?.trim() ?? ''
  } catch {
    return ''
  }
}

export default defineConfig(() => {
  const apiKey = leerApiKey()

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (apiKey) proxyReq.setHeader('x-api-key', apiKey)
            })
          },
        },
      },
    },
  }
})
