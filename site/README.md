# Sitio público

Landing y páginas legales. **Astro + Tailwind.** Vive en el mismo repo pero **es
un proyecto aparte**: tiene su propio `package.json`, su propio build y su propio
deploy. La dashboard va a `app.<dominio>` y esto a `<dominio>`.

## Por qué no está dentro de la app de `src/`

- La app no tiene router: navega con `useState` y vive en una sola URL.
- `App.jsx` monta `useMessages`, `useProducts`, `useSettings` y `useAgents` al
  cargar. Un visitante anónimo se bajaría el CRM entero y dispararía llamadas
  autenticadas que le devolverían 401, solo para leer un texto legal.
- Meta revisa las URLs legales durante el App Review y las vuelve a revisar
  después. Si la dashboard se cae con un deploy roto, estas páginas tienen que
  seguir arriba.

## Por qué Astro y no Vite + React como la dashboard

Esto era una SPA de React con react-router. El problema no era el tamaño sino
**cuándo** aparecía el contenido: las páginas se dibujaban recién cuando corría
el JavaScript, así que un bundle que no cargaba dejaba la política de privacidad
en blanco. Y esas URLs las revisa Meta.

Con Astro cada archivo de `src/pages` se convierte en un `.html` de verdad
durante el build. Además:

- **El navegador no descarga React.** Ningún componente se hidrata; lo poco
  interactivo que hay (el menú de la barra, el acordeón de preguntas) son
  scripts sueltos de unas quince líneas, y la película de "El control" es CSS
  sobre la captura de la bandeja.
- **Se cayó `react-router-dom`** y con él `public/_redirects`, que existía solo
  para que entrar en frío a `/privacidad` no diera 404. Ahora ese archivo
  existe.
- **Cada página tiene su propio `<title>` y sus propios `og:`.** Con una sola
  SPA había un único juego de etiquetas para las cuatro rutas.

Lo que se descarga hoy en cualquier página: el HTML, una hoja de estilos y las
dos tipografías. Nada más.

### React sigue instalado, pero no llega al navegador

Quedan cinco componentes en `.jsx` (`Boton`, `Footer`, `Logo`, `icons`,
`AppMock`). Son plantillas sin estado: Astro las ejecuta durante el build y
escribe su HTML en el archivo final. Se quedaron así porque convertirlas no
cambiaría nada de lo que recibe el visitante — en particular `icons.jsx`, que
exporta catorce íconos de un solo archivo y en Astro serían catorce archivos o
un `switch`.

El único costo es un `dist/_astro/client.*.js` con el runtime de React que la
integración emite igual: **ningún HTML lo referencia**, así que nadie lo
descarga. Si algún día molesta, hay que convertir esos cinco componentes a
`.astro` y sacar `@astrojs/react`.

## Comandos

```bash
cd site
npm install
npm run dev      # http://localhost:5174 (la dashboard usa el 5173)
npm run build
npm run preview
```

## Estructura

| Ruta              | Archivo                          |
| ----------------- | -------------------------------- |
| `/`               | `src/pages/index.astro`          |
| `/privacidad`     | `src/pages/privacidad.astro`     |
| `/terminos`       | `src/pages/terminos.astro`       |
| `/eliminar-datos` | `src/pages/eliminar-datos.astro` |

Las tres últimas se cargan en la consola de Meta, así que **no se les cambia la
URL una vez publicadas**. En Astro el nombre del archivo *es* la ruta, así que
renombrarlo es cambiarla.

`src/layouts/Base.astro` tiene el `<head>`, la barra, el pie y el
`IntersectionObserver` que dispara las animaciones de entrada. Cada página le
pasa su `title` y su `description`.

## Tailwind

`site/tailwind.config.js` **importa el tema de `../tailwind.config.js`** en vez
de copiarlo: es la misma marca, y dos paletas separadas empiezan iguales y
terminan distintas sin que nadie se dé cuenta. Están disponibles acá los mismos
tokens que en la app (`bg-surface-page`, `text-ink-primary`, `bg-accent-gradient`,
etc.).

No está `@astrojs/tailwind`: esa integración quedó pinneada a Astro 5 y no
soporta la 7. No hace falta — Astro procesa PostCSS de fábrica, así que alcanza
con `postcss.config.js` y con importar `src/index.css` en el layout.

Ojo con esto: editar **cualquiera de los dos** `tailwind.config.js` no se
refleja por HMR — hay que matar el server y volver a levantarlo. El plugin de
PostCSS hace el `require` una sola vez al arrancar y Node cachea el módulo.

## Tipografías

`public/fonts/` tiene las dos, servidas por nosotros y no por Google Fonts: sin
request a un tercero el sitio no depende de que ese dominio esté arriba ni filtra
la IP de quien visita.

- `baloo2-latin-800.woff2` — el logotipo. Va con `font-display: block` porque el
  `viewBox` del `<Logo>` está calculado contra sus métricas y el fallback saldría
  cortado.
- `inter-latin-var.woff2` — todo el resto del texto.

Las dos se precargan desde el `<head>` del layout.

## Deploy

Cualquier hosting estático: Cloudflare Pages, Netlify o Vercel, apuntando a
`site/` con `npm run build` y la carpeta de salida `dist`. Hace falta HTTPS —
Meta no acepta URLs sin él.

Ya no hace falta configurar un fallback de SPA: `dist` tiene un `index.html` por
ruta y el hosting los sirve directo.

## Qué URL va en cada campo de Meta

| Campo en la consola de Meta                | URL                                |
| ------------------------------------------ | ---------------------------------- |
| Sitio web del negocio (verificación)       | `https://<dominio>/`               |
| Política de privacidad                     | `https://<dominio>/privacidad`     |
| Eliminación de datos (URL o instrucciones) | `https://<dominio>/eliminar-datos` |

Embedded Signup **no** va acá: va en el dominio de la app, porque el cliente
tiene que existir antes de poder colgarle una WABA. Ese es el dominio que se
carga en *Allowed domains* y *Valid OAuth redirect URIs*.

## Pendiente

Los destinos de los botones (`src/config.js`) son provisorios: `APP_URL`,
`WHATSAPP_URL` y `EMAIL` apuntan a un dominio que todavía no existe. Falta
también `og:image`, que necesita una URL absoluta y por lo tanto ese mismo
dominio.
