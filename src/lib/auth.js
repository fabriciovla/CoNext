import { createClient } from '@supabase/supabase-js'

// Los ids son los de Supabase Auth (`signInWithOAuth`).
export const PROVEEDORES_OAUTH = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
]

const IDS = new Set(PROVEEDORES_OAUTH.map((p) => p.id))

export function esProveedorOAuth(id) {
  return IDS.has(String(id ?? ''))
}

function leerConfig() {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
  const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anon) return null
  return { url, anon }
}

export function authDisponible() {
  return Boolean(leerConfig())
}

let cliente = null

export function clienteAuth() {
  const cfg = leerConfig()
  if (!cfg) return null
  if (!cliente) {
    cliente = createClient(cfg.url, cfg.anon, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }
  return cliente
}

// A dónde tiene que volver el proveedor. Usa el `base` de Vite: `/` en local,
// `/app/` en el build. Arrancar el OAuth en *esta* origen es lo que hace que
// el PKCE funcione — si el popup nace en la landing (otro puerto), el verifier
// queda en otro localStorage y el callback muere.
export function urlTrasOAuth() {
  const base = import.meta.env.BASE_URL || '/'
  return new URL(base, window.location.origin).href
}

export function usuarioDeSesion(session) {
  const u = session?.user
  if (!u) return null
  const email = u.email ?? ''
  const meta = u.user_metadata ?? {}
  const username = String(
    meta.full_name || meta.name || meta.user_name || email.split('@')[0] || 'cuenta',
  ).trim()
  return {
    id: u.id,
    email,
    username,
    provider: u.app_metadata?.provider ?? u.app_metadata?.providers?.[0] ?? null,
  }
}
