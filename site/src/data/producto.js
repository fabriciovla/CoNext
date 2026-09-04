// Las páginas de producto. El menú, el pie y las rutas leen de acá:
// un slug nuevo es una fila, no tres archivos que se desincronizan.
// Los textos viven en i18n (`producto.paginas[slug]`); acá solo la forma.

export const PRODUCTO_COLUMNAS = [
  { id: 'atencion', slugs: ['bandeja', 'carpetas', 'notas'] },
  { id: 'inteligencia', slugs: ['agentes', 'borrador', 'clasificacion', 'automatizaciones'] },
  { id: 'operacion', slugs: ['catalogo', 'metricas', 'stock'] },
  { id: 'plataforma', slugs: ['api-whatsapp', 'equipo', 'datos'] },
]

export const PRODUCTO_PAGINAS = [
  { slug: 'bandeja', columna: 'atencion', icono: 'inbox' },
  { slug: 'carpetas', columna: 'atencion', icono: 'tag' },
  { slug: 'notas', columna: 'atencion', icono: 'note' },
  { slug: 'agentes', columna: 'inteligencia', icono: 'sparkles' },
  { slug: 'borrador', columna: 'inteligencia', icono: 'bolt' },
  { slug: 'clasificacion', columna: 'inteligencia', icono: 'layers' },
  { slug: 'automatizaciones', columna: 'inteligencia', icono: 'clock' },
  { slug: 'catalogo', columna: 'operacion', icono: 'box' },
  { slug: 'metricas', columna: 'operacion', icono: 'chart' },
  { slug: 'stock', columna: 'operacion', icono: 'alert' },
  { slug: 'api-whatsapp', columna: 'plataforma', icono: 'whatsapp' },
  { slug: 'equipo', columna: 'plataforma', icono: 'users' },
  { slug: 'datos', columna: 'plataforma', icono: 'shield' },
]

export function slugsProducto() {
  return PRODUCTO_PAGINAS.map((p) => p.slug)
}

export function paginaProducto(slug) {
  return PRODUCTO_PAGINAS.find((p) => p.slug === slug) ?? null
}

export function slugsDeColumna(columna) {
  return PRODUCTO_COLUMNAS.find((c) => c.id === columna)?.slugs ?? []
}

// Las tarjetas de la landing siguen teniendo id de ancla; las que ya tienen
// página propia apuntan acá para no dejar dos destinos del mismo tema.
export const LANDING_A_PRODUCTO = {
  bandeja: 'bandeja',
  agentes: 'agentes',
  automatico: 'borrador',
  productos: 'catalogo',
  dia: 'metricas',
}
