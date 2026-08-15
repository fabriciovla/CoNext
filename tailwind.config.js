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
        // Acento violeta → magenta (identidad de marca, usado en degradés).
        // El violeta también varía: el de marca (#9085e9) sobre un fondo claro
        // no llega a contrastar como texto, así que en el tema claro se oscurece.
        // El degradé de `accent-gradient` sí queda fijo: es la identidad.
        violet: {
          DEFAULT: token('--violet'),
          strong: '#7166d1',
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
      fontFamily: {
        sans: [
          'Inter',
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
        glow: '0 8px 24px -6px rgba(144,133,233,0.55)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        // Para lo que de verdad flota sobre la página (modal, menú, tooltip).
        // Las tarjetas no la usan: se apoyan en el borde.
        pop: 'var(--shadow-pop)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #9085e9 0%, #d55181 100%)',
      },
    },
  },
  plugins: [],
}
