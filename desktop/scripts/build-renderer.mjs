// Compila la dashboard para adentro de la app. Antes de llamar a Vite arma el
// archivo de variables que va a leer: las VITE_* del server (donde ya viven las
// de Supabase Auth, para no tener dos copias del mismo valor) más las de
// desktop/.env, que pisan a las de arriba. Se escribe como
// `.env.production.local`, que es el escalón de mayor precedencia de Vite: así
// no importa en qué archivo estaba cada variable, el resultado del merge es lo
// que gana.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const raiz = path.join(dir, '..')

const API_POR_DEFECTO = 'https://api.conext.lat'

const generado = path.join(dir, '.env.production.local')

// Se borra antes de leer: es la salida de la corrida anterior y Vite lo cargaría
// como si fuera configuración escrita a mano, con la máxima precedencia. Sin
// esto, una variable que alguien sacó de desktop/.env seguiría viva para
// siempre, copiada de un build al siguiente.
fs.rmSync(generado, { force: true })

const env = {
  ...loadEnv('production', path.join(raiz, 'server'), 'VITE_'),
  ...loadEnv('production', dir, 'VITE_'),
}

if (!String(env.VITE_API_URL ?? '').trim()) {
  env.VITE_API_URL = API_POR_DEFECTO
  console.warn(
    `\n  Sin VITE_API_URL: la app va a hablar con ${API_POR_DEFECTO}.\n` +
      '  Si la API está en otro lado, ponelo en desktop/.env.\n',
  )
}

if (!String(env.VITE_SUPABASE_URL ?? '').trim()) {
  // Sin Supabase la dashboard cae en el login de mentira, y ahí lo único que
  // autoriza las requests es la API key que inyecta el proxy de Vite — que en
  // la app de escritorio no existe. O sea: entra igual y después no anda nada.
  console.warn(
    '\n  Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no hay con qué iniciar sesión:\n' +
      '  la app no tiene el proxy que en desarrollo pone la API key.\n',
  )
}

fs.writeFileSync(
  generado,
  '# Generado por scripts/build-renderer.mjs. No lo edites: se pisa en cada build.\n' +
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') +
    '\n',
)

const resultado = spawnSync(
  'npx',
  ['vite', 'build', '--config', path.join(dir, 'vite.desktop.config.js')],
  { cwd: raiz, stdio: 'inherit', shell: true, env: process.env },
)

if (resultado.status !== 0) process.exit(resultado.status ?? 1)
