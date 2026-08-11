/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          page: '#000000',
          card: '#0d0d0d',
          raised: '#161616',
          hover: '#1e1e1e',
        },
        ink: {
          primary: '#ffffff',
          secondary: 'rgba(255,255,255,0.72)',
          muted: 'rgba(255,255,255,0.48)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          strong: 'rgba(255,255,255,0.14)',
        },
        // Acento violeta → magenta (identidad de marca, usado en degradés).
        violet: {
          DEFAULT: '#9085e9',
          strong: '#7166d1',
          soft: 'rgba(144,133,233,0.14)',
        },
        magenta: {
          DEFAULT: '#d55181',
          soft: 'rgba(213,81,129,0.14)',
        },
        // Paleta de estado fija (documentada, validada por separado del acento).
        status: {
          good: '#0ca30c',
          warning: '#fab219',
          serious: '#ec835a',
          critical: '#d03b3b',
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
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 30px -18px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #9085e9 0%, #d55181 100%)',
      },
    },
  },
  plugins: [],
}
