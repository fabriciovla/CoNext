// Curva suave (Catmull-Rom pasada a Bézier) que atraviesa todos los puntos.
// Vive acá y no adentro de un gráfico porque la usan los dos que dibujan una
// línea: el `AreaChart` de la página de Inicio y las miniaturas de las tarjetas
// de KPI. Si cada uno tuviera la suya, dos líneas del mismo dato se curvarían
// distinto y se notaría.
//
// **Los puntos de control se recortan al tramo que unen**, y eso no es un
// detalle de suavizado: Catmull-Rom sin recortar se pasa de los extremos. Con
// nueve meses en cero y después un salto a 65 —que es exactamente la forma de
// un cliente nuevo—, la curva se hundía por debajo del eje antes de subir y
// dibujaba mensajes negativos. También se pasa para arriba después de un pico,
// por encima del techo del eje. Acotando cada control al rango de sus dos
// puntos, la línea sigue siendo suave y no puede salirse de los valores que de
// verdad existen.
function acotar(valor, a, b) {
  return Math.min(Math.max(valor, Math.min(a, b)), Math.max(a, b))
}

export function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = acotar(p1.y + (p2.y - p0.y) / 6, p1.y, p2.y)
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = acotar(p2.y - (p3.y - p1.y) / 6, p1.y, p2.y)
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}
