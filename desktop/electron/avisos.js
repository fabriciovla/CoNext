import { Notification, app, nativeImage } from 'electron'

// Los avisos de que llegó un mensaje, que son tres cosas distintas y ninguna
// reemplaza a la otra:
//
//   · la notificación del sistema, que es lo único que se ve con la ventana
//     escondida o tapada;
//   · el contador arriba del ícono en la barra de tareas, que es lo que queda
//     después de que la notificación se va sola;
//   · el parpadeo del botón, que es lo que llama la atención sin robar el foco.
//
// Salen del proceso principal y no de la página: con `new Notification` del
// navegador, adentro de una ventana escondida el aviso no sale.

const LARGO_TITULO = 80
const LARGO_CUERPO = 240

// Lo que manda la página se recorta acá y no allá: es la última frontera antes
// de que el texto salga por un canal del sistema operativo, y un mensaje de
// WhatsApp puede tener cuatro mil caracteres.
const recortar = (texto, largo) => String(texto ?? '').replace(/\s+/g, ' ').trim().slice(0, largo)

// Hay que llamarla al arrancar, **antes** de crear la ventana y el ícono de la
// bandeja. No es una comprobación aunque lo parezca: es el armado.
//
// Windows construye el presentador de notificaciones la primera vez que alguien
// pregunta por él, y se queda con ese resultado —bueno o malo— para toda la
// sesión. Pedido tarde, con la ventana y el ícono ya montados, el armado falla:
// a partir de ahí `isSupported()` contesta false para siempre, `show()` no
// muestra nada y no hay error en ningún lado, ni en la consola ni en el evento
// `failed`. Así se comportó esto la primera vez que se probó: la app corriendo
// perfecta y ni un aviso, que es exactamente el síntoma que vino a arreglar.
//
// Preguntando una sola vez temprano queda cacheado el presentador que anda.
export function prepararAvisos() {
  return Notification.isSupported()
}

// `icono` es el de la app: en Windows la notificación toma el del atajo del
// menú Inicio, pero en Linux hay que dárselo, y darlo en los dos no molesta.
export function avisar({ titulo, cuerpo, icono, alTocar }) {
  if (!Notification.isSupported()) return false

  const aviso = new Notification({
    title: recortar(titulo, LARGO_TITULO) || 'conext',
    body: recortar(cuerpo, LARGO_CUERPO),
    icon: icono ? nativeImage.createFromPath(icono) : undefined,
    // El sonido lo pone el sistema. La dashboard tiene el suyo, que es el que
    // suena con la ventana a la vista; con la ventana escondida el que se
    // escucha es este, y los dos no se pisan porque nunca salen juntos.
    silent: false,
  })

  if (alTocar) aviso.on('click', alTocar)

  // Un aviso que el sistema rechaza no rompe nada y no se ve: queda una app
  // que no avisa y nadie sabe por qué. Al menos que quede escrito.
  aviso.on('failed', (_evento, error) => {
    console.error('[avisos] el sistema rechazó el aviso:', error)
  })

  aviso.show()
  return true
}

// El contador chiquito arriba del ícono. En Windows es una imagen encima del
// botón de la barra de tareas (`setOverlayIcon`) y la dibuja la página, que es
// la que tiene canvas y la que sabe de qué color va; en macOS y Linux el
// sistema dibuja el número solo a partir de `setBadgeCount`.
const ES_PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

export function marcarPendientes(ventana, cantidad, insignia) {
  const n = Number.isFinite(cantidad) ? Math.max(0, Math.trunc(cantidad)) : 0

  if (process.platform !== 'win32') {
    app.setBadgeCount(n)
    return true
  }

  if (!ventana || ventana.isDestroyed()) return false

  if (!n || !ES_PNG.test(String(insignia ?? ''))) {
    ventana.setOverlayIcon(null, '')
    return true
  }

  ventana.setOverlayIcon(
    nativeImage.createFromDataURL(insignia),
    `${n} mensaje${n === 1 ? '' : 's'} sin atender`,
  )
  return true
}

// El parpadeo del botón en la barra de tareas. Se apaga solo al enfocar la
// ventana (main.js lo engancha al evento `focus`): dejarlo prendido después de
// que la persona ya miró es ruido, y encima el sistema lo mantiene hasta que
// alguien lo baje.
export function parpadear(ventana) {
  if (!ventana || ventana.isDestroyed() || ventana.isFocused()) return false
  ventana.flashFrame(true)
  return true
}
