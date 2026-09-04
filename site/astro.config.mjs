// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { ORIGEN_CANONICO, esPaginaDeSitemap, hrefCanonico } from './src/lib/seo.js'

// text/plain sin charset se lee como Latin-1 en Chrome, y el llms.txt (UTF-8)
// sale con mojibake. El hosting pone la cabecera; Vite en local también.

function charsetLlms() {
  const middleware = (req, res, next) => {
    const ruta = (req.url ?? '').split('?')[0]
    if (!/(?:^|\/)(?:en\/)?llms(?:-full)?\.txt$/.test(ruta)) {
      next()
      return
    }
    const orig = res.setHeader.bind(res)
    res.setHeader = (name, value) => {
      if (String(name).toLowerCase() === 'content-type') {
        return orig('Content-Type', 'text/plain; charset=utf-8')
      }
      return orig(name, value)
    }
    next()
  }
  return {
    name: 'charset-llms',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

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
  // Apex: es el host canónico. www redirige acá (Vercel → Dominios, y
  // vercel.json). Si `site` apunta al host que redirige, Google descarta
  // la canónica y deja cada página como duplicada.
  site: ORIGEN_CANONICO,
  trailingSlash: 'never',
  redirects: {
    // URLs del mapa de producto en inglés / SEO; las canónicas siguen en español.
    '/producto/inbox': '/producto/bandeja',
    '/en/producto/inbox': '/en/producto/bandeja',
    '/producto/agentes-ia': '/producto/agentes',
    '/en/producto/agentes-ia': '/en/producto/agentes',
  },
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
      customPages: [
        `${ORIGEN_CANONICO}/llms.txt`,
        `${ORIGEN_CANONICO}/llms-full.txt`,
        `${ORIGEN_CANONICO}/en/llms.txt`,
        `${ORIGEN_CANONICO}/en/llms-full.txt`,
      ],
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
  vite: {
    plugins: [charsetLlms()],
  },
})
