// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

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
  site: 'https://conext.lat',
  integrations: [
    react(),
    // Genera /sitemap-index.xml en el build (robots.txt lo referencia).
    // /login se queda afuera: está con noindex y listarla en el sitemap
    // sería pedirle al buscador dos cosas contradictorias.
    sitemap({
      filter: (pagina) => !pagina.includes('/login'),
    }),
  ],
  server: {
    // 5173 se lo queda la dashboard; así los dos pueden correr a la vez.
    port: 5174,
  },
})
