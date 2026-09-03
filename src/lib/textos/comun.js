// Todos los textos de la dashboard, en los dos idiomas.
//
// Cada hoja es `{ es, en }` y no un archivo por idioma a propósito: puestas una
// al lado de la otra, una traducción que falta o que quedó vieja se ve en la
// misma línea. Con un archivo por idioma hay que abrir dos y compararlos a mano,
// que es como se llega a una pantalla mitad en un idioma y mitad en el otro.
//
// El valor puede ser un texto con marcadores `{nombre}` o una función. La
// función es la salida para todo lo que no se resuelve reemplazando: los
// plurales, sobre todo, que en español y en inglés no se arman igual —y menos
// cuando el plural cambia también el resto de la frase—. Los tres o cuatro
// casos que hay no justifican un motor de plurales.
//
// Las claves están en español porque el resto del código lo está. El idioma de
// las claves no se ve en ninguna pantalla.

const COMUN = {
  // Lo que aparece en más de una pantalla. Si un texto se usa en un solo lugar
  // va en la sección de esa pantalla, no acá: `comun` no es el cajón de sastre,
  // es lo que de verdad tiene que decirse igual en toda la app.
  comun: {
    guardar: { es: 'Guardar', en: 'Save' },
    cancelar: { es: 'Cancelar', en: 'Cancel' },
    eliminar: { es: 'Eliminar', en: 'Delete' },
    borrar: { es: 'Borrar', en: 'Delete' },
    editar: { es: 'Editar', en: 'Edit' },
    crear: { es: 'Crear', en: 'Create' },
    cerrar: { es: 'Cerrar', en: 'Close' },
    volver: { es: 'Volver', en: 'Back' },
    buscar: { es: 'Buscar', en: 'Search' },
    reintentar: { es: 'Reintentar', en: 'Try again' },
    actualizar: { es: 'Actualizar', en: 'Refresh' },
    cargando: { es: 'Cargando…', en: 'Loading…' },
    guardado: { es: 'Cambios guardados', en: 'Changes saved' },
    todos: { es: 'Todos', en: 'All' },
    ninguno: { es: 'Ninguno', en: 'None' },
    si: { es: 'Sí', en: 'Yes' },
    no: { es: 'No', en: 'No' },
    opcional: { es: 'opcional', en: 'optional' },
    proximamente: { es: 'Próximamente', en: 'Coming soon' },
    cerrarSesion: { es: 'Cerrar sesión', en: 'Sign out' },
    temaClaro: { es: 'Cambiar a tema claro', en: 'Switch to light theme' },
    temaOscuro: { es: 'Cambiar a tema oscuro', en: 'Switch to dark theme' },
    administrador: { es: 'Administrador', en: 'Administrator' },
    sinConexion: { es: 'Sin conexión', en: 'Not connected' },
    conectado: { es: 'Conectado', en: 'Connected' },
    conectar: { es: 'Conectar', en: 'Connect' },
    reconectar: { es: 'Reconectar', en: 'Reconnect' },
    desconectar: { es: 'Desconectar', en: 'Disconnect' },
    copiar: { es: 'Copiar', en: 'Copy' },
  },

  // Los días de la semana. La clave que se guarda sigue siendo `Lun`/`Mar` —es
  // la que usan el server y `businessHours`—; esto es solo cómo se leen.
  dias: {
    Lun: { es: 'Lunes', en: 'Monday' },
    Mar: { es: 'Martes', en: 'Tuesday' },
    'Mié': { es: 'Miércoles', en: 'Wednesday' },
    Jue: { es: 'Jueves', en: 'Thursday' },
    Vie: { es: 'Viernes', en: 'Friday' },
    'Sáb': { es: 'Sábado', en: 'Saturday' },
    Dom: { es: 'Domingo', en: 'Sunday' },
  },

  diasCorto: {
    Lun: { es: 'Lun', en: 'Mon' },
    Mar: { es: 'Mar', en: 'Tue' },
    'Mié': { es: 'Mié', en: 'Wed' },
    Jue: { es: 'Jue', en: 'Thu' },
    Vie: { es: 'Vie', en: 'Fri' },
    'Sáb': { es: 'Sáb', en: 'Sat' },
    Dom: { es: 'Dom', en: 'Sun' },
  },

  // El título de la pestaña del navegador y de la ventana.
  titulos: {
    home: { es: 'Inicio · conext', en: 'Home · conext' },
    inbox: { es: 'Bandeja · conext', en: 'Inbox · conext' },
    agents: { es: 'Agentes · conext', en: 'Agents · conext' },
    products: { es: 'Productos · conext', en: 'Products · conext' },
    templates: { es: 'Plantillas · conext', en: 'Templates · conext' },
    settings: { es: 'Configuración · conext', en: 'Settings · conext' },
    entrar: { es: 'Entrar · conext', en: 'Sign in · conext' },
  },

  nav: {
    home: { es: 'Inicio', en: 'Home' },
    inbox: { es: 'Bandeja', en: 'Inbox' },
    agents: { es: 'Agentes IA', en: 'AI agents' },
    products: { es: 'Productos', en: 'Products' },
    templates: { es: 'Plantillas', en: 'Templates' },
    settings: { es: 'Configuración', en: 'Settings' },
    carpetas: { es: 'Carpetas', en: 'Folders' },
    todas: { es: 'Todas', en: 'All' },
    mias: { es: 'Mías', en: 'Mine' },
    sinAsignar: { es: 'Sin asignar', en: 'Unassigned' },
    pendientes: { es: 'Pendientes', en: 'Pending' },
    nuevoAgente: { es: 'Nuevo agente', en: 'New agent' },
    diasArchivados: { es: 'Días archivados', en: 'Archived days' },
    sinDiasCerrados: {
      es: 'Todavía no cerraste ningún día.',
      en: "You haven't closed any day yet.",
    },
    bloqueados: { es: 'Contactos bloqueados', en: 'Blocked contacts' },
  },

  // El ciclo de vida del día, que se nombra en la barra, en Inicio y en el
  // modal de confirmación.
  dia: {
    abierto: { es: 'Día abierto', en: 'Day open' },
    cerrado: { es: 'Día cerrado', en: 'Day closed' },
    desde: { es: 'desde {hora}', en: 'since {hora}' },
    desdeLas: { es: 'desde las {hora}', en: 'since {hora}' },
    alas: { es: 'a las {hora}', en: 'at {hora}' },
    enCurso: { es: 'en curso', en: 'in progress' },
    cerrarDia: { es: 'Cerrar día', en: 'Close day' },
    abrirNuevo: { es: 'Abrir nuevo día', en: 'Open a new day' },
    confirmarCierre: {
      es: ({ mensajes, pendientes }) =>
        `Se van a archivar ${mensajes} mensaje${mensajes === 1 ? '' : 's'} de hoy` +
        (pendientes > 0
          ? `, incluyendo ${pendientes} pendiente${pendientes === 1 ? '' : 's'} de revisión`
          : '') +
        '. La bandeja va a quedar vacía hasta que abras un nuevo día.',
      en: ({ mensajes, pendientes }) =>
        `${mensajes} message${mensajes === 1 ? '' : 's'} from today will be archived` +
        (pendientes > 0
          ? `, including ${pendientes} awaiting review`
          : '') +
        '. The inbox will stay empty until you open a new day.',
    },
  },
}

export default COMUN
