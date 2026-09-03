// El globito con el número que va arriba del ícono de la app en la barra de
// tareas de Windows (`setOverlayIcon`). Se dibuja acá y no en el proceso
// principal por dos motivos: main no tiene canvas —tendría que traer diez PNG
// hechos a mano, uno por cantidad— y no sabe de qué color va, que es el mismo
// naranja de la burbuja de pendientes de la bandeja y sale del tema puesto.
//
// Mide 32 y no 16: Windows lo pide a 16 lógicos y lo escala por el DPI de la
// pantalla, y achicar se ve bien donde agrandar se ve pastoso.
const LADO = 32

// El mismo par que usa la burbuja de la lista: fondo `status-warning`, número
// `status-ink`. Se leen del tema en vez de escribirlos, que es la regla de la
// casa —ningún componente nombra un color— y de paso el globo acompaña cuando
// se cambia de tema. Los literales son el respaldo por si la variable no está.
function color(nombre, respaldo) {
  if (typeof document === 'undefined') return respaldo
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
  return /^\d+\s+\d+\s+\d+$/.test(valor) ? `rgb(${valor})` : respaldo
}

export function dibujarInsignia(cantidad) {
  const n = Math.max(0, Math.trunc(Number(cantidad) || 0))
  if (!n || typeof document === 'undefined') return null

  const lienzo = document.createElement('canvas')
  lienzo.width = LADO
  lienzo.height = LADO
  const ctx = lienzo.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = color('--status-warning', 'rgb(250 178 25)')
  ctx.beginPath()
  ctx.arc(LADO / 2, LADO / 2, LADO / 2, 0, Math.PI * 2)
  ctx.fill()

  // Arriba de nueve el número no entra en un círculo de 16px reales, y un "12"
  // apretado se lee como una mancha. Lo que importa a esa altura es que hay
  // varios, no cuántos.
  const texto = n > 9 ? '9+' : String(n)

  ctx.fillStyle = color('--status-ink', 'rgb(0 0 0)')
  ctx.font = `bold ${texto.length > 1 ? 17 : 21}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  // `middle` cae un pelo alto con la mayoría de las fuentes; el +1 lo apoya en
  // el centro óptico del círculo.
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, LADO / 2, LADO / 2 + 1)

  return lienzo.toDataURL('image/png')
}
