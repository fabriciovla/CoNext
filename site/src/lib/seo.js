// Host canónico: el apex. www redirige acá (dominio primario en Vercel +
// vercel.json). Una canónica que apunta al host que redirige la descarta
// Google y deja la página como duplicada, sin versión elegida.

export const ORIGEN_CANONICO = 'https://conext.lat'

export function origenDe(site) {
  if (!site) return ORIGEN_CANONICO
  return (site instanceof URL ? site : new URL(String(site))).origin
}

export function normalizarRuta(pathname) {
  if (!pathname) return '/'
  const ruta = pathname.split('?')[0].split('#')[0]
  if (ruta === '/' || ruta === '') return '/'
  return ruta.replace(/\/+$/, '') || '/'
}

function hrefDesde(origen, pathname) {
  const ruta = normalizarRuta(pathname)
  return ruta === '/' ? `${origen}/` : `${origen}${ruta}`
}

export function urlCanonico(pathname, site) {
  return new URL(hrefDesde(origenDe(site), pathname))
}

export function hrefCanonico(href) {
  const u = new URL(href)
  return hrefDesde(u.origin, u.pathname)
}

export function esPaginaDeSitemap(href) {
  const ruta = normalizarRuta(new URL(href).pathname)
  if (ruta === '/login' || ruta.endsWith('/login')) return false
  if (ruta === '/empezar' || ruta.endsWith('/empezar')) return false
  if (ruta === '/404' || ruta.endsWith('/404')) return false
  if (ruta === '/500' || ruta.endsWith('/500')) return false
  return true
}
