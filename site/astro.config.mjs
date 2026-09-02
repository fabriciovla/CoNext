// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { esPaginaDeSitemap, hrefCanonico } from './src/lib/seo.js'

// Reemplaza a vite.config.js: Astro trae Vite adentro y lo configura solo.
//
// No está `@astrojs/tailwind`: esa integración quedó pinneada a Astro 5 y no
// soporta la 7. No hace falta igual — Astro procesa PostCSS de fábrica, así que
// alcanza con el postcss.config.js que ya estaba y con importar el CSS global
// en el layout.
//
// La integración de React está para que los componentes .jsx que ya existían se
// sigan usando tal cual. La mayoría se renderiza en el build y no manda una
// línea de JavaScript al navegador; solo los tres que necesitan estado llevan
// una directiva `client:` y viajan como islas.
export default defineConfig({
  // www es el host que Vercel sirve con 200. El apex (conext.lat) redirige
  // con 308: si `site` apunta ahí, el sitemap y las canónicas mandan al
  // buscador a una URL que redirige, y Google las trata como si no hubiera
  // canónica. Si se apaga el redirect a www en el dominio, hay que volver
  // este valor al apex.
  site: 'https://www.conext.lat',
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    react(),
    // Genera /sitemap-index.xml en el build (robots.txt lo referencia).
    // /login, /empezar y las de error se quedan afuera: van con noindex
    // y listarlas en el sitemap sería pedirle al buscador dos cosas
    // contradictorias. Los códigos hreflang coinciden con los del <head>
    // (`es` / `en`): mezclar es-AR acá y es allá es un par hreflang inválido.
    sitemap({
      filter: esPaginaDeSitemap,
      serialize(item) {
        item.url = hrefCanonico(item.url)
        if (item.links) {
          item.links = item.links.map((link) => ({
            ...link,
            url: hrefCanonico(link.url),
          }))
          const es = item.links.find((link) => link.lang === 'es')
          if (es && !item.links.some((link) => link.lang === 'x-default')) {
            item.links.push({ ...es, lang: 'x-default' })
          }
        }
        item.lastmod = new Date().toISOString()
        return item
      },
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es', en: 'en' },
      },
    }),
  ],
  server: {
    // 5173 se lo queda la dashboard; así los dos pueden correr a la vez.
    port: 5174,
  },
})
