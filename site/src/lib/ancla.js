// Id de ancla a partir de un título. Lo usan las páginas de artículo y el
// catálogo de llms.txt, para que el hash del índice coincida con el h2.

export function anclaDeTitulo(titulo) {
  return String(titulo)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}
