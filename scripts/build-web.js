// Build de lo que se publica en el dominio: la landing en `/` y la dashboard
// en `/app`. Si el hosting apunta al `npm run build` de la raíz, sin esto el
// visitante cae en el CRM en vez de en la página.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.join(root, 'site')

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

// Las deps del sitio viven en site/package.json, no en el de la raíz. El
// `npm install` de Vercel solo llena node_modules de arriba. Si acá
// preguntábamos "¿está astro?" y había cache de un deploy viejo, se saltaba
// el install y @astrojs/sitemap (u otra integración nueva) no existía.
// `--include=dev`: con NODE_ENV=production npm se salta Tailwind y PostCSS,
// que el build de Astro necesita igual.
run('npm', ['install', '--include=dev'], site)

run('npm', ['run', 'build', '--', '--outDir', '../dist'], site)
run('npx', ['vite', 'build', '--outDir', 'dist/app', '--base', '/app/'], root)

fs.writeFileSync(path.join(root, 'dist', '_redirects'), '/app/*  /app/index.html  200\n')
