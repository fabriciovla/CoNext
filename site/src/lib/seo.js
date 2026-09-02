// URL canónica del sitio. El host que responde 200 es www: Vercel redirige
// el apex (conext.lat) con 308, y una canónica que apunta al apex es una
// canónica que redirige. Google la ignora y la página queda como duplicada
// sin versión elegida, o rastreada y sin indexar.

const ORIGEN_FALLBACK = 'https://www.conext.lat'

export function origenDe(site) {
  if (!site) return ORIGEN_FALLBACK
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
