// Destinos de los botones de la landing, juntos para no buscarlos por los
// componentes. El dominio es conext.lat.
//
// - APP_URL: la dashboard. En local, el Vite de la raíz (puerto 5173); en el
//   build, /app del mismo dominio. El form de /login manda para acá.
// - GITHUB_URL: el perfil; en la barra va solo el isotipo, sin texto.
// - WHATSAPP_URL: wa.me quiere el número en dígitos, sin '+' ni espacios.
// - EMAIL: el que reciba las consultas. Conviene uno del dominio.
export const APP_URL = import.meta.env.DEV ? 'http://localhost:5173' : '/app'
export const GITHUB_URL = 'https://github.com/fabriciovla'
export const WHATSAPP_URL = 'https://wa.me/5490000000000'
export const EMAIL = 'contact@conext.lat'
