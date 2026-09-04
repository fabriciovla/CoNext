import { BrowserWindow, Menu, app, shell } from 'electron'

const esMac = process.platform === 'darwin'

// El menú por defecto de Electron viene en inglés y con entradas que acá no
// significan nada. Este es el mínimo que hace falta: los roles de edición (en
// macOS, sin ellos no hay Cmd+C ni Cmd+V ni en un campo de texto), el zoom y
// una forma de recargar cuando el server volvió después de estar caído.
//
// La ventana no tiene marco, así que este menú **no se dibuja**: los paneles
// los pinta la dashboard (TitleBar) para poder redondearlos y darles el hover
// del resto de la app. Sigue puesto porque es de donde salen los atajos de
// teclado. Cada ítem lleva un `id` para que el click de esa barra dispare el
// mismo role (`ejecutarComando`).

let menu = null
let soporteUrl = ''

function emitir(accion) {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  win?.webContents.send('conext:menu-accion', accion)
}

function plantilla({ soporte }) {
  return [
    ...(esMac
      ? [{
          id: 'app',
          label: 'conext',
          submenu: [
            { role: 'about', label: 'Acerca de conext' },
            { type: 'separator' },
            { role: 'hide', label: 'Ocultar conext' },
            { role: 'hideOthers', label: 'Ocultar otras' },
            { role: 'unhide', label: 'Mostrar todas' },
            { type: 'separator' },
            { id: 'quit', role: 'quit', label: 'Salir de conext' },
          ],
        }]
      : []),
    {
      id: 'archivo',
      label: 'Archivo',
      submenu: [
        {
          id: 'nuevo-agente',
          label: 'Nuevo agente',
          accelerator: 'CmdOrCtrl+N',
          click: () => emitir('nuevo-agente'),
        },
        { type: 'separator' },
        { id: 'cerrar-dia', label: 'Cerrar día', click: () => emitir('cerrar-dia') },
        { id: 'abrir-dia', label: 'Abrir nuevo día', click: () => emitir('abrir-dia') },
        { type: 'separator' },
        { id: 'cerrar-sesion', label: 'Cerrar sesión', click: () => emitir('cerrar-sesion') },
        { type: 'separator' },
        esMac
          ? { id: 'close', role: 'close', label: 'Cerrar ventana' }
          : { id: 'quit', role: 'quit', label: 'Salir' },
      ],
    },
    {
      id: 'edicion',
      label: 'Edición',
      submenu: [
        { id: 'undo', role: 'undo', label: 'Deshacer' },
        { id: 'redo', role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { id: 'cut', role: 'cut', label: 'Cortar' },
        { id: 'copy', role: 'copy', label: 'Copiar' },
        { id: 'paste', role: 'paste', label: 'Pegar' },
        { id: 'selectAll', role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
    {
      id: 'ver',
      label: 'Ver',
      submenu: [
        { id: 'reload', role: 'reload', label: 'Recargar' },
        { id: 'forceReload', role: 'forceReload', label: 'Recargar sin caché' },
        { type: 'separator' },
        { id: 'resetZoom', role: 'resetZoom', label: 'Tamaño normal' },
        { id: 'zoomIn', role: 'zoomIn', label: 'Acercar' },
        { id: 'zoomOut', role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { id: 'togglefullscreen', role: 'togglefullscreen', label: 'Pantalla completa' },
        { id: 'toggleDevTools', role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
      ],
    },
    // "Ventana" no está en Windows: su único ítem era Minimizar, que es el
    // botón que quedó a la derecha de esta misma barra.
    ...(esMac
      ? [{
          id: 'ventana',
          label: 'Ventana',
          submenu: [
            { id: 'minimize', role: 'minimize', label: 'Minimizar' },
            { id: 'zoom', role: 'zoom', label: 'Zoom' },
            { id: 'front', role: 'front', label: 'Traer todo al frente' },
          ],
        }]
      : []),
    {
      id: 'ayuda-menu',
      label: 'Ayuda',
      submenu: [{ id: 'ayuda', label: 'Ayuda de conext', click: () => shell.openExternal(soporte) }],
    },
  ]
}

export function montarMenu({ soporte }) {
  soporteUrl = soporte
  const items = plantilla({ soporte })
  menu = Menu.buildFromTemplate(items)
  Menu.setApplicationMenu(menu)
}

function buscarItem(items, id) {
  for (const item of items) {
    if (item.id === id) return item
    if (item.submenu) {
      const hallado = buscarItem(item.submenu.items, id)
      if (hallado) return hallado
    }
  }
  return null
}

// Lo que dispara el click de un ítem de la barra HTML: el mismo role que el
// atajo de teclado, para que Copiar copie de verdad y Salir pase por `quit`.
export function ejecutarComando(ventana, id) {
  if (id === 'ayuda') {
    if (soporteUrl) void shell.openExternal(soporteUrl)
    return true
  }
  const item = menu ? buscarItem(menu.items, id) : null
  if (!item) return false
  item.click({ sender: ventana?.webContents }, ventana, ventana?.webContents)
  return true
}
