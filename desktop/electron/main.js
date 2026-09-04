import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BrowserWindow, app, dialog, ipcMain, nativeTheme, session, shell } from 'electron'
import { avisar, marcarPendientes, parpadear, prepararAvisos } from './avisos.js'
import { montarBandeja, primerCierre, soltarBandeja } from './bandeja.js'
import { ejecutarComando, montarMenu } from './menu.js'
import { permitirAbrirOAuth, registrarEsquemaOAuth, urlDeArgv } from './oauth.js'
import { leerOrigenes } from './origenes.js'
import { ORIGEN, registrarEsquema, servirRenderer } from './protocolo.js'
import { MINIMO, guardarEstado, leerEstado } from './ventana.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const RENDERER = path.resolve(dir, '..', 'renderer')
const ICONO = path.resolve(dir, '..', 'build', 'icon.png')
const SOPORTE = 'https://conext.lat/ayuda'

// Windows cuelga las notificaciones de un AppUserModelID, no del proceso: sin
// declararlo, los avisos salen a nombre de "electron.app.Electron" o no salen.
// Es el mismo `appId` que declara electron-builder, que es el que queda en el
// atajo del menú Inicio que crea el instalador.
//
// Ojo en desarrollo: Windows exige que exista un atajo con ese mismo id para
// mostrar el toast. Corriendo con `npm run dev` puede no aparecer nada aunque
// el código esté bien; instalado, sale. Es del sistema, no nuestro.
app.setAppUserModelId('lat.conext.dashboard')

// Con `CONEXT_DEV_URL` la ventana carga el server de Vite de la raíz en vez del
// build. Es la forma de trabajar la dashboard adentro de la app sin recompilar
// a cada cambio, y de paso ahí la API key la sigue inyectando el proxy de Vite,
// que es lo que autoriza contra el server local.
// La franja de arriba la dibuja la dashboard, pero los botones de minimizar,
// maximizar y cerrar los sigue dibujando el sistema encima (`titleBarOverlay`):
// así se comportan como los de cualquier otra ventana —incluido el imán del
// borde derecho para acomodarla— sin que tengamos que reimplementar nada.
// Windows quiere esos colores en hexa y no entiende las variables CSS del tema,
// así que la página se los manda cuando cambia; esto es solo el arranque, antes
// de que haya página, y por eso sale de la conjetura del sistema operativo.
const BARRA_INICIAL = () => ({
  color: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
  symbolColor: nativeTheme.shouldUseDarkColors ? '#c4c4ca' : '#343e55',
  height: 32,
})

const DEV_URL = process.env.CONEXT_DEV_URL || (process.argv.includes('--dev') ? 'http://localhost:5173' : '')

// Va antes de `whenReady`: después el esquema ya quedó registrado sin
// privilegios y `app://` sería un origen opaco (ver protocolo.js).
if (!DEV_URL) registrarEsquema()

let ventana = null
// La vuelta del login social puede llegar con la ventana todavía cargando —o
// sin ventana, si el deep link fue lo que abrió la app—, así que se guarda hasta
// que haya alguien del otro lado.
let cargado = false
let oauthPendiente = null
// Cerrar la ventana esconde; salir de verdad es el ítem del menú del ícono, el
// "Salir" del menú Archivo o un apagado del sistema. Esta bandera es la que
// distingue los dos casos adentro del mismo evento `close`.
let saliendo = false

function alFrente() {
  if (!ventana) return crearVentana()
  // Escondida hace falta `show()`: `focus()` sobre una ventana que no está en
  // pantalla no la trae de vuelta, y desde afuera se ve como que el ícono de la
  // bandeja no hace nada.
  if (!ventana.isVisible()) ventana.show()
  if (ventana.isMinimized()) ventana.restore()
  ventana.focus()
}

function salir() {
  saliendo = true
  app.quit()
}

function entregarOAuth(url) {
  if (!url) return
  if (ventana && cargado) ventana.webContents.send('conext:oauth', url)
  else oauthPendiente = url
  alFrente()
}

// macOS no usa argv para esto. Va antes de `whenReady`: si el deep link es lo
// que abre la app, el evento llega enseguida.
app.on('open-url', (evento, url) => {
  evento.preventDefault()
  entregarOAuth(url)
})

function abrirAfuera(url) {
  // Solo http(s). Un `file://` o un esquema raro llegado desde la página es
  // ejecución de cualquier cosa con el shell del sistema operativo.
  if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
}

// El alta embebida de Meta (Configuración → WhatsApp / Página) abre una ventana
// suya con `window.open` y se comunica con la nuestra por `postMessage`. Si esa
// ventana se manda al navegador del sistema, el mensaje vuelve a otro proceso y
// el alta no termina nunca; así que las de Facebook se abren como ventana hija
// de verdad y todo lo demás sale afuera.
function esDeFacebook(url) {
  try {
    return /(^|\.)facebook\.com$/.test(new URL(url).hostname)
  } catch {
    return false
  }
}

function crearVentana() {
  const estado = leerEstado()

  ventana = new BrowserWindow({
    width: estado.width,
    height: estado.height,
    x: estado.x,
    y: estado.y,
    minWidth: MINIMO.width,
    minHeight: MINIMO.height,
    // La ventana se muestra recién cuando hay algo pintado. Sin esto se ve el
    // marco vacío mientras carga el bundle. El color de fondo es la conjetura
    // del tema del sistema: el tema real lo pone el script del <head> apenas
    // corre, y sin conjetura el primer cuadro es blanco aunque la dashboard
    // esté en oscuro.
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#faf9f7',
    title: 'conext',
    autoHideMenuBar: true,
    // Sin marco del sistema: la barra de título es una fila más de la
    // dashboard. En macOS no hay overlay, las luces se dibujan solas y lo
    // único que hace falta es dejarles el lugar (ver TitleBar.jsx).
    titleBarStyle: 'hidden',
    ...(process.platform === 'darwin' ? {} : { titleBarOverlay: BARRA_INICIAL() }),
    webPreferences: {
      preload: path.join(dir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      // Sin esto, la bandeja escondida deja de traer mensajes igual que antes.
      // Chromium le baja la prioridad a los temporizadores de una página que no
      // se ve —y después de un rato la congela del todo—, así que el poll de
      // `useMessages` se estiraría a un minuto largo o se detendría, que es
      // justo lo que la app en segundo plano no puede hacer. El costo es que la
      // página sigue gastando CPU escondida; por eso el poll oculto es de 30s y
      // no de 6 (ver POLL_OCULTO_MS).
      backgroundThrottling: false,
      additionalArguments: [`--conext-version=${app.getVersion()}`],
    },
  })

  if (estado.maximizada) ventana.maximize()

  ventana.once('ready-to-show', () => ventana.show())

  ventana.webContents.on('did-finish-load', () => {
    cargado = true
    if (!oauthPendiente) return
    ventana.webContents.send('conext:oauth', oauthPendiente)
    oauthPendiente = null
  })

  // `getNormalBounds` se lee al cerrar, no en cada píxel del arrastre.
  //
  // Y cerrar no cierra: esconde. Es lo que hace cualquier app de mensajería, y
  // acá no es una preferencia estética —con el proceso muerto no hay webhook
  // que valga, los mensajes se quedan en el server y nadie se entera hasta que
  // alguien vuelve a abrir la app—. Salir de verdad es el "Salir" del ícono de
  // la bandeja o el del menú Archivo, que pasan por `app.quit()`.
  ventana.on('close', (evento) => {
    guardarEstado(ventana)
    if (saliendo) return

    evento.preventDefault()
    ventana.hide()

    // La primera vez hay que decirlo: una ventana que se cierra y un proceso
    // que sigue vivo, sin avisar, se lee como que la app quedó colgada.
    if (primerCierre()) {
      avisar({
        titulo: 'conext sigue abierto',
        cuerpo: 'Seguís recibiendo los mensajes. El ícono al lado del reloj lo vuelve a abrir, y ahí está "Salir".',
        icono: ICONO,
        alTocar: alFrente,
      })
    }
  })

  ventana.on('closed', () => {
    ventana = null
    cargado = false
  })

  // El parpadeo del botón en la barra de tareas se apaga en cuanto la persona
  // mira, que es lo que significa. El sistema no lo baja solo.
  ventana.on('focus', () => ventana.flashFrame(false))

  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (esDeFacebook(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 620,
          height: 760,
          autoHideMenuBar: true,
          webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
        },
      }
    }
    abrirAfuera(url)
    return { action: 'deny' }
  })

  // Un enlace común no puede reemplazar la app por otro sitio: la ventana
  // principal no navega a ningún lado que no sea la dashboard. Sin esto, un
  // `target` mal puesto deja al usuario adentro de una página web sin barra de
  // direcciones y sin forma de volver.
  ventana.webContents.on('will-navigate', (evento, url) => {
    const destino = DEV_URL || ORIGEN
    if (url.startsWith(destino)) return
    evento.preventDefault()
    abrirAfuera(url)
  })

  if (DEV_URL) {
    void ventana.loadURL(DEV_URL)
    ventana.webContents.openDevTools({ mode: 'detach' })
  } else {
    void ventana.loadURL(`${ORIGEN}/index.html`)
  }
}

// Una sola instancia: abrir el acceso directo dos veces trae al frente la que
// ya está en vez de levantar otra dashboard con su propio poll cada 6s.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // La segunda instancia es también por donde llega el deep link del login en
  // Windows y Linux: el navegador termina el OAuth, el sistema abre la app con
  // `conext://auth?code=…` en argv y el lock manda ese argv para acá.
  app.on('second-instance', (_evento, argv) => {
    const url = urlDeArgv(argv)
    if (url) entregarOAuth(url)
    else alFrente()
  })

  app.whenReady().then(() => {
    if (!DEV_URL) {
      if (!fs.existsSync(path.join(RENDERER, 'index.html'))) {
        dialog.showErrorBox(
          'Falta compilar la dashboard',
          'No está desktop/renderer. Corré "npm run build:renderer" adentro de desktop/ y volvé a abrir.',
        )
        app.quit()
        return
      }
      servirRenderer(RENDERER)
    }

    // Antes que la ventana y que el ícono de la bandeja: es lo que deja armado
    // el presentador de notificaciones de Windows. Movido más abajo, los avisos
    // dejan de salir y no avisa nada (ver prepararAvisos).
    prepararAvisos()

    // El corrector viene en inglés de fábrica y subraya en rojo cada respuesta
    // que se escribe en el composer.
    try {
      session.defaultSession.setSpellCheckerLanguages(['es'])
    } catch {
      /* si el diccionario no está, se queda con el de fábrica */
    }

    registrarEsquemaOAuth()
    permitirAbrirOAuth(leerOrigenes(RENDERER))

    montarMenu({ soporte: SOPORTE })

    // Click de un ítem de la barra HTML: corre el mismo role que el atajo
    // (copiar, recargar, salir) para que no haya dos implementaciones.
    ipcMain.handle('conext:comando-menu', (evento, id) => {
      if (typeof id !== 'string' || !id) return false
      const suya = BrowserWindow.fromWebContents(evento.sender)
      return suya ? ejecutarComando(suya, id) : false
    })

    // El tema lo decide la página (es su localStorage), así que es la página la
    // que le pasa al sistema con qué pintar los botones de la ventana. Sin
    // esto, al cambiar a oscuro quedaba un rectángulo blanco en la esquina.
    ipcMain.handle('conext:pintar-barra', (evento, color, symbolColor) => {
      if (process.platform === 'darwin') return false
      const suya = BrowserWindow.fromWebContents(evento.sender)
      if (!suya || !/^#[0-9a-f]{6}$/i.test(color ?? '') || !/^#[0-9a-f]{6}$/i.test(symbolColor ?? '')) {
        return false
      }
      suya.setTitleBarOverlay({ color, symbolColor, height: 32 })
      return true
    })

    // Llegó un mensaje. La página es la que se entera (es la que polea) y el
    // proceso principal el que puede avisar con la ventana escondida, así que
    // el aviso cruza el puente. Tocarlo abre la conversación: sin eso, el aviso
    // te deja parado en la pantalla en la que estabas y hay que buscar a mano
    // de quién era el mensaje que acabás de leer en el toast.
    ipcMain.handle('conext:avisar', (_evento, datos) => {
      const phone = typeof datos?.phone === 'string' ? datos.phone : null
      parpadear(ventana)
      return avisar({
        titulo: datos?.titulo,
        cuerpo: datos?.cuerpo,
        icono: ICONO,
        alTocar: () => {
          alFrente()
          if (phone && ventana && cargado) ventana.webContents.send('conext:abrir-conversacion', phone)
        },
      })
    })

    // El contador arriba del ícono de la barra de tareas. La imagen la dibuja la
    // página: es la que tiene canvas y la que sabe de qué color va el globo en
    // el tema puesto.
    ipcMain.handle('conext:marcar', (_evento, cantidad, insignia) =>
      marcarPendientes(ventana, cantidad, insignia),
    )

    crearVentana()

    montarBandeja({ archivo: ICONO, abrir: alFrente, salir })

    // `before-quit` es la otra puerta: Salir del menú, Alt+F4 sobre el proceso,
    // un apagado del sistema o el reinicio del instalador. Sin esto, cualquiera
    // de esos casos entraría al `close` de la ventana, se toparía con el
    // `preventDefault` y la app no se cerraría nunca.
    app.on('before-quit', () => {
      saliendo = true
      soltarBandeja()
    })

    // Si el deep link fue lo que abrió la app, viene en el argv de arranque.
    entregarOAuth(urlDeArgv(process.argv))

    // Tocar el ícono del dock en macOS. `alFrente` cubre los dos casos: la
    // ventana escondida se muestra y, si de verdad no hay ninguna, se crea.
    app.on('activate', alFrente)
  })

  // Ya no se llega acá cerrando la ventana —eso ahora la esconde—, pero la
  // ventana sí se destruye en el camino de salida, y sin esta guarda ese cierre
  // dispararía un `app.quit()` de más en el medio del que ya está corriendo.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && saliendo) app.quit()
  })
}
