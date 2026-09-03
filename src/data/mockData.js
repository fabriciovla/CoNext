// Cada mensaje pertenece a la conversación de un teléfono.
//   direction: 'in'     → lo escribió el cliente. Lleva `type` y `status`.
//   direction: 'out'    → lo mandó la tienda. Lleva `author` ('bot' | 'admin').
//   direction: 'nota'   → comentario interno del equipo. No se le envía a nadie.
//   direction: 'evento' → traza del sistema (apertura, cambio de etapa).
// Solo los entrantes se cuentan en estadísticas y en los pendientes; las notas
// y los eventos viven en el hilo pero no son mensajes de la conversación.
export const initialMessages = [
  {
    id: 'm1',
    customer: 'Laura Gómez',
    phone: '+54 9 11 2345-6789',
    text: '¿Tienen la remera talle M en stock?',
    direction: 'in',
    type: 'automatico',
    status: 'resuelto',
    createdAt: '2026-08-10T09:12:00',
  },
  {
    id: 'm1r',
    customer: 'Laura Gómez',
    phone: '+54 9 11 2345-6789',
    text: '¡Hola Laura! Sí, tenemos la remera básica de algodón en talle M. ¿Querés que te reserve una?',
    direction: 'out',
    author: 'bot',
    createdAt: '2026-08-10T09:12:30',
  },
  {
    id: 'm2',
    customer: 'Martín Ríos',
    phone: '+54 9 11 3344-5566',
    text: 'Quiero cancelar mi pedido #4521',
    direction: 'in',
    type: 'pendiente',
    status: 'resuelto',
    createdAt: '2026-08-10T09:40:00',
  },
  {
    id: 'm2r',
    customer: 'Martín Ríos',
    phone: '+54 9 11 3344-5566',
    text: 'Hola Martín, ya di de baja el pedido #4521. El reintegro se acredita en 48 h hábiles.',
    direction: 'out',
    author: 'admin',
    createdAt: '2026-08-10T09:44:00',
  },
  {
    id: 'm3',
    customer: 'Carla Núñez',
    phone: '+54 9 11 9988-7766',
    text: '¿Cuál es el horario de atención?',
    direction: 'in',
    type: 'automatico',
    status: 'resuelto',
    createdAt: '2026-08-10T10:02:00',
  },
  {
    id: 'm3r',
    customer: 'Carla Núñez',
    phone: '+54 9 11 9988-7766',
    text: 'Atendemos de lunes a viernes de 9:00 a 18:00. 🕘',
    direction: 'out',
    author: 'bot',
    createdAt: '2026-08-10T10:02:20',
  },
  {
    id: 'm4',
    customer: 'Diego Fernández',
    phone: '+54 9 11 5566-1122',
    text: 'El pago no se acreditó, necesito ayuda urgente',
    direction: 'in',
    type: 'pendiente',
    status: 'pendiente',
    createdAt: '2026-08-10T10:15:00',
  },
  {
    id: 'm5',
    customer: 'Sofía Alvarez',
    phone: '+54 9 11 7788-3344',
    text: 'Gracias por la info, ya hice la compra',
    direction: 'in',
    type: 'automatico',
    status: 'resuelto',
    createdAt: '2026-08-10T10:31:00',
  },
  {
    id: 'm5r',
    customer: 'Sofía Alvarez',
    phone: '+54 9 11 7788-3344',
    text: '¡Gracias por tu compra, Sofía! Te avisamos apenas salga el envío. 📦',
    direction: 'out',
    author: 'bot',
    createdAt: '2026-08-10T10:31:15',
  },
  {
    id: 'm6',
    customer: 'Nicolás Paz',
    phone: '+54 9 11 4455-2233',
    text: '¿Hacen envíos a Córdoba?',
    direction: 'in',
    type: 'automatico',
    status: 'resuelto',
    createdAt: '2026-08-10T10:47:00',
  },
  {
    id: 'm6r',
    customer: 'Nicolás Paz',
    phone: '+54 9 11 4455-2233',
    text: '¡Sí! Enviamos a todo el país con Correo Argentino. A Córdoba tarda entre 3 y 5 días hábiles.',
    direction: 'out',
    author: 'bot',
    createdAt: '2026-08-10T10:47:25',
  },
  {
    id: 'm7',
    customer: 'Laura Gómez',
    phone: '+54 9 11 2345-6789',
    text: 'Perfecto, ¿y en color negro también hay?',
    direction: 'in',
    type: 'pendiente',
    status: 'pendiente',
    createdAt: '2026-08-10T11:05:00',
  },
  {
    id: 'm8',
    customer: 'Martín Ríos',
    phone: '+54 9 11 3344-5566',
    text: 'Ya me confirmaron el reintegro, gracias',
    direction: 'in',
    type: 'automatico',
    status: 'resuelto',
    createdAt: '2026-08-10T11:20:00',
  },
  {
    id: 'm8r',
    customer: 'Martín Ríos',
    phone: '+54 9 11 3344-5566',
    text: '¡Genial! Cualquier cosa que necesites, escribinos. 😊',
    direction: 'out',
    author: 'bot',
    createdAt: '2026-08-10T11:20:30',
  },

  // Trazas y notas internas: le dan al hilo el contexto que el equipo necesita
  // (quién abrió la conversación, cuándo cambió de etapa, qué hay que tener en
  // cuenta) sin mezclarse con lo que ve el cliente.
  {
    id: 'e1',
    phone: '+54 9 11 2345-6789',
    customer: 'Laura Gómez',
    text: 'Conversación abierta por el contacto',
    direction: 'evento',
    createdAt: '2026-08-10T09:11:50',
  },
  {
    id: 'n1',
    phone: '+54 9 11 2345-6789',
    customer: 'Laura Gómez',
    text: '@Equipo depósito — clienta que ya compró dos veces. Si no hay negro en M, ofrecerle el azul noche antes de perder la venta.',
    direction: 'nota',
    author: 'admin',
    createdAt: '2026-08-10T11:06:00',
  },
  {
    id: 'e3',
    phone: '+54 9 11 5566-1122',
    customer: 'Diego Fernández',
    text: 'Conversación abierta por el contacto',
    direction: 'evento',
    createdAt: '2026-08-10T10:14:50',
  },
  {
    id: 'n2',
    phone: '+54 9 11 5566-1122',
    customer: 'Diego Fernández',
    text: '@Administración — verificar el pago en Mercado Pago antes de responder.',
    direction: 'nota',
    author: 'admin',
    createdAt: '2026-08-10T10:16:00',
  },
]

// Los agentes ya no viven acá: son configurables y se leen de GET /agents
// (useAgents). Lo que queda en `contactMeta` es solo la key con la que quedó
// asociada cada conversación de ejemplo.

// Ficha del contacto: agente que lo atendió y responsable humano.
// `assignee: null` = sin asignar (la carpeta que el equipo mira primero).
export const contactMeta = {
  '+54 9 11 2345-6789': { agent: 'recepcion', assignee: 'admin' },
  '+54 9 11 3344-5566': { agent: 'soporte', assignee: 'admin' },
  '+54 9 11 9988-7766': { agent: 'recepcion', assignee: null },
  '+54 9 11 5566-1122': { agent: 'soporte', assignee: null },
  '+54 9 11 7788-3344': { agent: 'ventas', assignee: 'admin' },
  '+54 9 11 4455-2233': { agent: 'ventas', assignee: null },
}

// Carpetas del catálogo de ejemplo. Estos ids son solo para atar los productos
// de abajo desde el seed; en la base los genera el server.
export const initialProductFolders = [
  { id: 'f1', name: 'Indumentaria' },
  { id: 'f2', name: 'Calzado' },
  { id: 'f3', name: 'Accesorios' },
]

// La campera queda a propósito sin carpeta: es el estado en el que nace todo
// producto, y así la sección arranca mostrando también esa fila.
export const initialProducts = [
  { id: 'p1', name: 'Remera básica algodón', price: 12500, stock: 34, folderId: 'f1' },
  { id: 'p2', name: 'Buzo canguro friza', price: 27900, stock: 12, folderId: 'f1' },
  { id: 'p3', name: 'Zapatillas urbanas', price: 45900, stock: 0, folderId: 'f2' },
  { id: 'p4', name: 'Gorra bordada', price: 8900, stock: 21, folderId: 'f3' },
  { id: 'p5', name: 'Campera impermeable', price: 39900, stock: 5, folderId: null },
]

export const initialSettings = {
  storeName: 'Tienda Ejemplo',
  whatsappNumber: '+54 9 11 2000-3000',
  openTime: '09:00',
  closeTime: '18:00',
  daysOpen: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
  weeklyHours: {
    Lun: { openTime: '09:00', closeTime: '18:00' },
    Mar: { openTime: '09:00', closeTime: '18:00' },
    Mié: { openTime: '09:00', closeTime: '18:00' },
    Jue: { openTime: '09:00', closeTime: '18:00' },
    Vie: { openTime: '09:00', closeTime: '18:00' },
    Sáb: null,
    Dom: null,
  },
  welcomeMessage: '¡Hola! Gracias por escribirnos. En breve te respondemos 😊',
  awayMessage: '¡Hola! Ahora estamos cerrados. Te respondemos apenas abramos 😊',
}

export const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Tendencia mensual de ejemplo para el gráfico de Inicio.
// El mes va como número (0 = enero) y no como "Ene": el rótulo lo arma Inicio
// con el locale que esté puesto, así la abreviatura sale en el idioma de la
// dashboard sin tener que mantener doce nombres por idioma acá adentro.
export const monthlyActivity = [
  { month: 0, total: 12, automaticos: 8 },
  { month: 1, total: 15, automaticos: 10 },
  { month: 2, total: 14, automaticos: 9 },
  { month: 3, total: 18, automaticos: 13 },
  { month: 4, total: 21, automaticos: 15 },
  { month: 5, total: 19, automaticos: 14 },
  { month: 6, total: 23, automaticos: 17 },
  { month: 7, total: 27, automaticos: 20 },
  { month: 8, total: 24, automaticos: 18 },
  { month: 9, total: 29, automaticos: 22 },
  { month: 10, total: 26, automaticos: 19 },
  { month: 11, total: 31, automaticos: 24 },
]
