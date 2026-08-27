import { useId } from 'react'

// El logotipo de la marca. Es el mismo archivo que usa la landing
// (`site/src/components/Logo.jsx`): si cambia uno, cambian los dos.
//
// Son dos componentes. `Logo` es el logotipo entero —la marca y el nombre— y
// va en las barras, el pie y el encabezado del formulario de ingreso.
// `LogoMarca` es la marca sola: va en el panel de /login, donde el nombre
// escrito compite con el titular que tiene justo debajo.
//
// La marca son dos formas superpuestas —registros y contexto en capas— y no una
// letra, así que aguanta sola a 16 px; es la misma que va en el ícono de app.
// El nombre va en Satoshi Medium.
//
// El SVG va en línea y no como `<img src="/conext-logo.svg">` por el color: un
// `<img>` se pinta aislado y no hereda nada del documento, así que la única
// forma de que el logotipo tome `currentColor` es que sus `path` estén acá.
// Los lugares que lo usan ya lo envolvían en `text-ink-primary` —negro en el
// tema claro, blanco en el oscuro—, y esas clases no hacían nada mientras esto
// fue una imagen. Que las dos formas se pinten del mismo color es lo que lo
// hace posible: el hueco entre ellas no es un color, es una máscara, así que la
// marca entera sale de `currentColor` sin una variante por tema.
//
// La máscara necesita un `id` y el logotipo se dibuja más de una vez en la
// misma página (/login lo pinta en el panel y en la versión chica). Con un id
// fijo, las dos instancias comparten la primera definición y la marca se rompe
// si esa se desmonta; `useId` le da uno propio a cada una. Se le sacan los dos
// puntos porque `useId` los mete y adentro de un `url(#…)` molestan.
//
// Ojo con `conext-mark.svg`, que es otra cosa: ese es el ícono de app, la
// marca sola sobre la baldosa crema, con sus colores fijos.
//
// Las letras son contornos sacados de la tabla `glyf` del TTF de **Satoshi
// Medium**, que es la misma familia que usa el resto del texto. Van como
// contornos igual y no como `<text>`: el logotipo no puede quedar a merced de
// que la fuente haya cargado, y así el peso queda clavado en Medium aunque lo
// que se sirve sea el archivo variable.
// Medium y no Bold a propósito. Antes esto era Baloo 2 ExtraBold, que al lado
// de una marca que ya es una mancha sólida sumaba peso sobre peso; el nombre
// más liviano deja que la marca sea lo que pesa.
// `public/conext-logo.svg` tiene el mismo dibujo: son tres copias y se retocan
// las tres.
//
// La marca se dimensiona contra la **tinta** del nombre (0.966 de su alto), no
// contra el cuerpo de la fuente, y el aire del medio también se mide entre
// tintas: 0.30 em. Medido entre cajas —que es como lo da el pliego— la marca
// trae 21% de margen adentro de la suya y quedan 0.68 em de blanco a la vista,
// con lo que el logotipo se lee como dos cosas sueltas. El nombre va centrado
// ópticamente contra la tinta de la marca, que no es lo mismo que centrar su
// caja de línea.
//
// Sin `width`/`height` en los SVG: con el `viewBox` solo, `h-7 w-auto` mide
// la proporción de la tinta y saca el ancho de ahí.

// La máscara y las dos formas, que dibujan los dos componentes de este archivo.
function Marca({ id }) {
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="30">
            <rect x="119" y="205" width="190" height="190" rx="74" ry="74" transform="rotate(8 214 300)" />
          </g>
        </mask>
      </defs>
      <g transform="translate(256 256) scale(1.06) translate(-256 -256)">
        <g mask={`url(#${id})`}>
          <rect x="197" y="127" width="190" height="190" rx="74" ry="74" transform="rotate(-12 292 222)" />
        </g>
        <rect x="119" y="205" width="190" height="190" rx="74" ry="74" transform="rotate(8 214 300)" />
      </g>
    </>
  )
}

const idMascara = (bruto) => `marca-${bruto.replace(/:/g, '')}`

export default function Logo({ className = '' }) {
  const mascara = idMascara(useId())
  return (
    <svg
      viewBox="233.726 -642 3762.306 654"
      fill="currentColor"
      role="img"
      aria-label="conext"
      className={`logo-marca ${className}`.trim()}
    >
      <g transform="translate(0 -880.334) scale(2.169)">
        <Marca id={mascara} />
      </g>
      <g transform="translate(1130.032 0)">
        <path d="M36 -244Q36 -359 102.5 -431Q169 -503 276 -503Q368 -503 428.5 -454.5Q489 -406 502 -324L408 -324Q396 -370 361.5 -394.5Q327 -419 279 -419Q212 -419 170.5 -371.5Q129 -324 129 -245Q129 -166 168.5 -119Q208 -72 275 -72Q325 -72 360.5 -96.5Q396 -121 409 -165L503 -165Q489 -85 426 -36.5Q363 12 275 12Q167 12 101.5 -58Q36 -128 36 -244Z" />
        <path d="M795 -502Q905 -502 977 -430Q1049 -358 1049 -245Q1049 -132 977 -60Q905 12 795 12Q684 12 612 -60Q540 -132 540 -245Q540 -358 612 -430Q684 -502 795 -502ZM679.5 -370Q635 -322 635 -245Q635 -168 679.5 -120Q724 -72 795 -72Q866 -72 910.5 -120.5Q955 -169 955 -245Q955 -321 910.5 -369.5Q866 -418 795 -418Q724 -418 679.5 -370Z" />
        <path d="M1217 0L1123 0L1123 -489L1208 -489L1218 -414Q1241 -456 1284.5 -479.5Q1328 -503 1380 -503Q1474 -503 1521 -449.5Q1568 -396 1568 -299L1568 0L1474 0L1474 -278Q1474 -417 1356 -417Q1291 -417 1254 -374Q1217 -331 1217 -259L1217 0Z" />
        <path d="M1879 12Q1771 12 1703.5 -59Q1636 -130 1636 -244Q1636 -359 1702.5 -431Q1769 -503 1875 -503Q1979 -503 2042 -437Q2105 -371 2105 -262L2105 -227L1727 -226Q1732 -149 1771.5 -107.5Q1811 -66 1881 -66Q1993 -66 2018 -152L2106 -152Q2088 -73 2029 -30.5Q1970 12 1879 12ZM1875 -424Q1814 -424 1776 -389Q1738 -354 1729 -289L2011 -289Q2011 -350 1974 -387Q1937 -424 1875 -424Z" />
        <path d="M2230 0L2122 0L2293 -242L2123 -489L2232 -489L2356 -307L2477 -489L2584 -489L2414 -242L2581 0L2472 0L2350 -179L2230 0Z" />
        <path d="M2770 0L2676 0L2676 -410L2580 -410L2580 -489L2676 -489L2676 -642L2770 -642L2770 -489L2866 -489L2866 -410L2770 -410L2770 0Z" />
      </g>
    </svg>
  )
}

export function LogoMarca({ className = '' }) {
  const mascara = idMascara(useId())
  return (
    <svg
      viewBox="107.75 115 291.5 291.25"
      fill="currentColor"
      role="img"
      aria-label="conext"
      className={`logo-marca ${className}`.trim()}
    >
      <Marca id={mascara} />
    </svg>
  )
}
