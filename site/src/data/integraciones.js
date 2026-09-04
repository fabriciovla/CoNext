// Páginas de integraciones. El pie, el índice y las rutas leen de acá;
// los textos viven en i18n (`integraciones.paginas[slug]`).

export const INTEGRACIONES_PAGINAS = [
  { slug: 'whatsapp', icono: 'whatsapp' },
  { slug: 'instagram', icono: 'instagram' },
  { slug: 'webhooks', icono: 'layers' },
]

export function slugsIntegraciones() {
  return INTEGRACIONES_PAGINAS.map((p) => p.slug)
}

export function paginaIntegracion(slug) {
  return INTEGRACIONES_PAGINAS.find((p) => p.slug === slug) ?? null
}
