import base from '../tailwind.config.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,js,jsx}'],
  // El tema sale del config de la dashboard en vez de copiarse: es la misma
  // marca, y dos paletas separadas empiezan iguales y terminan distintas sin
  // que nadie se dé cuenta. Si hiciera falta algo propio del sitio público, se
  // agrega en un `extend` acá abajo sin tocar el de la app.
  theme: base.theme,
  plugins: [],
}
