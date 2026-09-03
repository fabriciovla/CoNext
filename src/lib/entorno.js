// `window.conext` lo planta el preload de la app de escritorio (desktop/) y no
// existe en el navegador.
//
// Lo único que cambia entre las dos es cómo vuelve el login social. En una
// pestaña, el proveedor redirige de vuelta a la misma URL y Supabase levanta el
// código de ahí. Adentro de la app no se puede: la página vive en
// `app://conext/`, que ningún navegador sabe abrir, y Google además rechaza el
// login dentro de una ventana embebida. Así que en escritorio el OAuth se abre
// en el navegador del sistema y vuelve por un esquema propio, `conext://auth`,
// que el proceso principal captura y le pasa a la página.
export function esEscritorio() {
  return typeof window !== 'undefined' && window.conext?.escritorio === true
}

// A dónde tiene que volver el proveedor cuando corre adentro de la app. Va
// también en las Redirect URLs de Supabase Auth: si no está permitida, Supabase
// manda a la Site URL y el deep link no llega nunca.
export const VUELTA_ESCRITORIO = 'conext://auth'

// El proceso principal es el que abre el navegador: la página no puede, y que
// no pueda es a propósito — un `shell.openExternal` con una URL cualquiera
// venida del renderer es ejecución de lo que sea con el shell del sistema. Main
// solo deja pasar la URL de autorización de Supabase.
export async function abrirOAuthAfuera(url) {
  return Boolean(await window.conext?.abrirOAuth?.(url))
}

// Se suscribe a la vuelta del proveedor. Devuelve la baja.
//
// El preload guarda el deep link si llegó antes de que alguien se suscribiera:
// la ventana puede terminar de cargar y recibir la URL antes de que React
// monte, y sin ese buffer ese login se perdería.
export function alVolverDeOAuth(callback) {
  return window.conext?.alVolverDeOAuth?.(callback) ?? (() => {})
}

// Comando del menú de aplicación que tiene que correr en el proceso principal
// (copiar, recargar, salir, abrir la ayuda). Los paneles los dibuja la
// dashboard; esto es solo la acción.
export function comandoDeVentana(id) {
  return window.conext?.comando?.(id)
}

// Atajos que no son un role de Electron (nuevo agente, cerrar el día). El
// proceso principal los dispara y la página los ejecuta. Devuelve la baja.
export function alAccionDeMenu(callback) {
  return window.conext?.alAccionDeMenu?.(callback) ?? (() => {})
}

// Windows quiere los colores de los botones de la ventana en hexa y no sabe
// nada del tema, así que se los pasa la página cada vez que cambia.
export function pintarBarraDeVentana(color, colorDeSimbolos) {
  return window.conext?.pintarBarra?.(color, colorDeSimbolos)
}

export function esMacOS() {
  return window.conext?.plataforma === 'darwin'
}

// El aviso de que llegó un mensaje. Lo dispara el proceso principal y no un
// `new Notification` de la página: con la ventana escondida —que es el único
// momento en que este aviso sirve para algo— el de la página no sale.
//
// `phone` es a qué conversación lleva el click. Va acá y no en el texto porque
// el aviso es lo mismo que una fila de la bandeja: sirve por lo que abre.
export function avisarEnEscritorio({ titulo, cuerpo, phone }) {
  return window.conext?.avisar?.({ titulo, cuerpo, phone })
}

// El contador arriba del ícono de la barra de tareas. `insignia` es el PNG que
// dibuja la página (ver lib/insignia.js); en macOS y Linux se ignora, ahí el
// número lo dibuja el sistema a partir de la cantidad.
export function marcarPendientesEnEscritorio(cantidad, insignia) {
  return window.conext?.marcar?.(cantidad, insignia)
}

// Se suscribe al click en una notificación. Devuelve la baja.
export function alTocarAviso(callback) {
  return window.conext?.alTocarAviso?.(callback) ?? (() => {})
}
