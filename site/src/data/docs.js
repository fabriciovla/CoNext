// Guías cortas. No reemplazan al centro de ayuda: son el camino de
// conexión y de la IA, no la factura ni el borrado de datos.

export const DOCS_PAGINAS = [
  { slug: 'primeros-pasos', icono: 'bolt' },
  { slug: 'configurar-ia', icono: 'sparkles' },
  { slug: 'webhooks-api', icono: 'layers' },
]

export function slugsDocs() {
  return DOCS_PAGINAS.map((p) => p.slug)
}

export function paginaDoc(slug) {
  return DOCS_PAGINAS.find((p) => p.slug === slug) ?? null
}
