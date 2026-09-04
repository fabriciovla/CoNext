import fs from 'node:fs'
import path from 'node:path'
import { Menu, Tray, app, nativeImage } from 'electron'

// El ícono al lado del reloj es lo que sostiene la app con la ventana cerrada.
// Sin él, cerrar la ventana mataba el proceso —`window-all-closed` llamaba a
// `app.quit()`— y no entraba ni un mensaje hasta la próxima vez que alguien
// abriera la app. Cerrar ahora esconde; el proceso sigue vivo, el poll sigue
// corriendo y los avisos siguen saliendo. De acá salen las dos únicas cosas que
// hacen falta con la ventana escondida: volver a abrirla y salir de verdad.

let bandeja = null

const ARCHIVO = () => path.join(app.getPath('userData'), 'bandeja.json')

// Windows pide el ícono de la bandeja a 16px lógicos y lo escala según el DPI.
// Una sola imagen de 16 se ve pastosa al 150%, así que se arma con las dos
// escalas y el sistema elige. Si el armado falla se cae al redimensionado
// simple: quedarse sin ícono es quedarse sin forma de reabrir la app.
function icono(archivo) {
  const origen = nativeImage.createFromPath(archivo)
  const escala = (n) => origen.resize({ width: n, height: n, quality: 'best' })

  try {
    const imagen = nativeImage.createEmpty()
    imagen.addRepresentation({ scaleFactor: 1, width: 16, height: 16, buffer: escala(16).toPNG() })
    imagen.addRepresentation({ scaleFactor: 2, width: 16, height: 16, buffer: escala(32).toPNG() })
    if (!imagen.isEmpty()) return imagen
  } catch {
    /* abajo */
  }

  return escala(16)
}

export function montarBandeja({ archivo, abrir, salir }) {
  if (bandeja) return bandeja

  bandeja = new Tray(icono(archivo))
  bandeja.setToolTip('conext')
  bandeja.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir conext', click: abrir },
      { type: 'separator' },
      { label: 'Salir', click: salir },
    ]),
  )

  // En Windows el click izquierdo no abre el menú de contexto: abre la app, que
  // es lo que espera cualquiera que le apunte al ícono. El menú queda en el
  // click derecho, que es donde el sistema lo pone solo.
  bandeja.on('click', abrir)

  return bandeja
}

export function soltarBandeja() {
  bandeja?.destroy()
  bandeja = null
}

// La primera vez que se cierra la ventana hay que decir que la app sigue
// abierta. Sin eso, cerrar y ver que el proceso sigue vivo se lee como que la
// app no cerró bien, y peor: quien quiera cerrarla de verdad no tiene forma de
// saber que eso está en el menú del ícono. Se dice una sola vez en la vida de
// la instalación —de ahí el archivo en userData— porque es un aviso que se
// entiende de una y molesta de dos.
export function primerCierre() {
  try {
    if (JSON.parse(fs.readFileSync(ARCHIVO(), 'utf-8'))?.avisado) return false
  } catch {
    /* no hay archivo todavía: es la primera */
  }

  try {
    fs.writeFileSync(ARCHIVO(), JSON.stringify({ avisado: true }))
  } catch {
    // Que no se pueda escribir no es motivo para no avisar; a lo sumo el aviso
    // vuelve a salir la próxima vez.
  }

  return true
}
