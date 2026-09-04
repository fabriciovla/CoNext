// CommonJS a propósito: este paquete es `"type": "module"`, así que un preload
// terminado en `.js` se parsearía como ESM, y el preload ESM de Electron solo
// anda con el sandbox apagado. Con `.cjs` no hay que apagar nada.
const { contextBridge, ipcRenderer } = require('electron')

const argumento = (nombre) => {
  const prefijo = `--conext-${nombre}=`
  return process.argv.find((a) => a.startsWith(prefijo))?.slice(prefijo.length) ?? ''
}

// La vuelta del login social puede llegar antes de que React monte: la ventana
// termina de cargar, el proceso principal manda el deep link y recién después
// corre el efecto que se suscribe. Sin guardarlo, ese ingreso se perdería y la
// pantalla se quedaría esperando para siempre.
let pendiente = null
let escucha = null

ipcRenderer.on('conext:oauth', (_evento, url) => {
  if (escucha) escucha(url)
  else pendiente = url
})

// Lo único que cruza el puente. La dashboard habla con el server por fetch,
// igual que en el navegador; `escritorio` es lo que el frontend mira para saber
// que no está en una pestaña (ver src/lib/entorno.js).

// Tocar una notificación abre esa conversación. Igual que con el OAuth, el
// mensaje puede llegar antes de que React se suscriba —la ventana estaba
// escondida, se muestra y recién ahí monta lo que faltaba—, así que el último
// pedido se guarda hasta que haya alguien escuchando.
let conversacionPendiente = null
let escuchaConversacion = null

ipcRenderer.on('conext:abrir-conversacion', (_evento, phone) => {
  if (escuchaConversacion) escuchaConversacion(phone)
  else conversacionPendiente = phone
})

let accionPendiente = null
let escuchaMenu = null

ipcRenderer.on('conext:menu-accion', (_evento, accion) => {
  if (escuchaMenu) escuchaMenu(accion)
  else accionPendiente = accion
})

contextBridge.exposeInMainWorld('conext', {
  escritorio: true,
  plataforma: process.platform,
  version: argumento('version'),
  comando: (id) => ipcRenderer.invoke('conext:comando-menu', id),
  alAccionDeMenu: (callback) => {
    escuchaMenu = callback
    if (accionPendiente) {
      const accion = accionPendiente
      accionPendiente = null
      callback(accion)
    }
    return () => {
      if (escuchaMenu === callback) escuchaMenu = null
    }
  },
  pintarBarra: (color, symbolColor) => ipcRenderer.invoke('conext:pintar-barra', color, symbolColor),
  abrirOAuth: (url) => ipcRenderer.invoke('conext:abrir-oauth', url),
  avisar: (datos) => ipcRenderer.invoke('conext:avisar', datos),
  marcar: (cantidad, insignia) => ipcRenderer.invoke('conext:marcar', cantidad, insignia),
  alTocarAviso: (callback) => {
    escuchaConversacion = callback
    if (conversacionPendiente) {
      const phone = conversacionPendiente
      conversacionPendiente = null
      callback(phone)
    }
    return () => {
      if (escuchaConversacion === callback) escuchaConversacion = null
    }
  },
  alVolverDeOAuth: (callback) => {
    escucha = callback
    if (pendiente) {
      const url = pendiente
      pendiente = null
      callback(url)
    }
    return () => {
      if (escucha === callback) escucha = null
    }
  },
})
