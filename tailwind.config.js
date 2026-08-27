/** @type {import('tailwindcss').Config} */
// Los colores salen de variables CSS (definidas en index.css) y no de literales:
// eso es lo que permite tener tema claro y oscuro sin duplicar una sola clase.
// La sintaxis `rgb(var(--x) / <alpha-value>)` mantiene vivo el `/50` de Tailwind.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tinta de superposición: el gris de los bordes, los fondos sutiles y el
        // texto apagado salen de acá. Es blanca sobre el tema oscuro y negra
        // sobre el claro, así `bg-tint/[0.04]` significa lo mismo en los dos.
        tint: token('--tint'),
        // Velo del modal. Va como variable entera y no por `token()` porque su
        // alfa es parte del valor: cuánto tapa cambia por tema (ver index.css).
        scrim: 'var(--scrim)',
        surface: {
          page: token('--surface-page'),
          card: token('--surface-card'),
          raised: token('--surface-raised'),
          hover: token('--surface-hover'),
          nav: token('--surface-nav'),
        },
        ink: {
          primary: token('--ink-primary'),
          secondary: token('--ink-secondary'),
          muted: token('--ink-muted'),
          faint: token('--ink-faint'),
          // Para texto o íconos que van encima de un fondo `ink-primary`
          // (el botón sólido, por ejemplo): siempre contrasta con él.
          inverted: token('--ink-inverted'),
        },
        border: {
          DEFAULT: token('--border'),
          strong: token('--border-strong'),
        },
        // El acento. Sigue llamándose `violet` por el nombre de la clase, que
        // está escrito en medio proyecto, pero desde que se adoptó la paleta de
        // dock.us es azul rey: #4058ff en el tema claro y #7b95ff en el oscuro,
        // porque el mismo azul sobre negro se apaga.
        violet: {
          DEFAULT: token('--violet'),
          strong: '#2f45d6',
          soft: 'rgb(var(--violet-soft) / <alpha-value>)',
        },
        magenta: {
          DEFAULT: '#d55181',
          soft: 'rgba(213,81,129,0.14)',
        },
        // Paleta de estado fija (documentada, validada por separado del acento).
        // El verde y el amarillo se oscurecen en el tema claro para que sigan
        // leyéndose sobre blanco; por eso también salen de variables.
        status: {
          good: token('--status-good'),
          warning: token('--status-warning'),
          serious: token('--status-serious'),
          critical: token('--status-critical'),
          ink: token('--status-ink'),
        },
      },
      // Satoshi, en su versión variable (300 a 900 en un archivo de 42 KB). Se
      // sirve desde `public/fonts/` en los dos proyectos — no hay pedido a
      // Google Fonts ni a ningún CDN.
      //
      // Reemplazó a Inter, que era una grotesca de interfaz, neutra a
      // propósito. Satoshi es geométrica y tiene más carácter: es lo que hace
      // que un bloque de texto se lea como producto y no como panel de control.
      // El stack de respaldo sigue siendo el del sistema, para los 100 ms que
      // tarda en llegar el archivo.
      fontFamily: {
        sans: [
          'Satoshi',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      boxShadow: {
        glow: '0 8px 24px -6px rgba(64,88,255,0.45)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        // Para lo que de verdad flota sobre la página (modal, menú, tooltip).
        // Las tarjetas no la usan: se apoyan en el borde.
        pop: 'var(--shadow-pop)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #4058ff 0%, #408cff 100%)',
      },
    },
  },
  plugins: [],
}
