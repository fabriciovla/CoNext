// Comparativas contra otras herramientas. El menú, el pie y las rutas leen
// de acá; los textos viven en i18n (`comparar.paginas[slug]`).

export const COMPARAR_PAGINAS = [
  { slug: 'conext-vs-respondio', icono: 'users' },
  { slug: 'conext-vs-wati', icono: 'whatsapp' },
  { slug: 'conext-vs-manychat', icono: 'sparkles' },
]

export function slugsComparar() {
  return COMPARAR_PAGINAS.map((p) => p.slug)
}

export function paginaComparar(slug) {
  return COMPARAR_PAGINAS.find((p) => p.slug === slug) ?? null
}
