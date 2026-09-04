import { ui } from './ui.js'

export const locales = ['es', 'en']
export const defaultLocale = 'es'

export function getLocale(astro) {
  if (astro?.currentLocale === 'en') return 'en'
  const first = astro?.url?.pathname?.split('/').filter(Boolean)[0]
  return first === 'en' ? 'en' : 'es'
}

export function t(lang) {
  return ui[lang] ?? ui.es
}

export function fill(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

// `path` es una ruta del locale por defecto (`/ayuda`, `/#funciones`).
export function pathFor(lang, path) {
  const hashAt = path.indexOf('#')
  const hash = hashAt >= 0 ? path.slice(hashAt) : ''
  let p = hashAt >= 0 ? path.slice(0, hashAt) : path
  if (!p) p = '/'
  if (lang === 'es') return `${p}${hash}`
  // Sin barra final: `trailingSlash: 'never'` y Vercel redirigen `/en/` a `/en`.
  if (p === '/') return `/en${hash}`
  return `/en${p}${hash}`
}

export function switchLocale(pathname, target) {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  return pathFor(target, stripped)
}
