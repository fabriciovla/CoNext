import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const dir = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.join(dir, '..')
const salida = path.join(dir, 'renderer')

// El mismo bundle de siempre, con dos diferencias.
//
// `base: './'`: publicada, la dashboard vive en /app/ y las URLs salen de ahí.
// Acá el documento es `app://conext/index.html`, así que las rutas van
// relativas — y eso incluye lo que el código arma con `import.meta.env.BASE_URL`
// (los logos de los canales, el avatar sin foto), que es el motivo por el que
// esas imágenes no se escriben nunca a mano con una barra adelante.
//
// `envDir` apunta a desktop/ y no a server/: la app de escritorio no habla con
// localhost:3001 a través del proxy de Vite —no hay proxy—, sino con la API
// publicada, y eso es otro VITE_API_URL. El merge con las variables del server
// lo hace scripts/build-renderer.mjs, que deja acá un .env.production.local.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, dir, 'VITE_')
  const api = String(env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

  if (!api) {
    throw new Error(
      'Falta VITE_API_URL. Sin una URL absoluta, la app pediría app://conext/api/... y no existe.\n' +
        'Copiá desktop/.env.example a desktop/.env y completala.',
    )
  }

  return {
    root: raiz,
    base: './',
    envDir: dir,
    plugins: [
      react(),
      {
        // El proceso principal necesita saber a qué dominios va a hablar la
        // página para armar el Content-Security-Policy. Son los mismos valores
        // que quedaron adentro del bundle: si se escribieran a mano en los dos
        // lados, el día que cambie uno la app carga bien y después cada request
        // muere bloqueada por CSP, que es un error que no dice de dónde salió.
        name: 'conext-origenes',
        closeBundle() {
          const supabase = String(env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '')
          fs.writeFileSync(
            path.join(salida, 'origenes.json'),
            JSON.stringify({ api, supabase }, null, 2),
          )
        },
      },
    ],
    build: {
      outDir: salida,
      // outDir cae afuera de `root`, y ahí Vite pide permiso antes de borrar.
      emptyOutDir: true,
    },
  }
})
