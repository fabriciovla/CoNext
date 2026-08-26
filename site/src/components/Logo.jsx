// El logotipo de la marca. Es el mismo archivo que usa la dashboard
// (`src/components/ui/Logo.jsx`): si cambia uno, cambian los dos.
//
// La luna hace de "c" y el nombre sigue de corrido: `(onext`. No son dos
// piezas con aire en el medio —así lo presenta el pliego de marca, y en una
// barra dejaba el isotipo suelto por un lado y el nombre por el otro—, sino un
// solo bloque en el que la marca es la inicial.
//
// El SVG va en línea y no como `<img src="/conext-logo.svg">` por el color: un
// `<img>` se pinta aislado y no hereda nada del documento, así que la única
// forma de que el logotipo tome `currentColor` es que sus `path` estén acá.
// Los lugares que lo usan ya lo envolvían en `text-ink-primary` —negro en el
// tema claro, blanco en el oscuro—, y esas clases no hacían nada mientras esto
// fue una imagen. Ojo con `conext-mark.svg`, que es otra cosa: ese es el ícono
// de app, la luna sola sobre la baldosa crema, con sus colores fijos.
//
// Las letras son contornos sacados de la tabla `glyf` del TTF de Instrument
// Sans SemiBold, la tipografía del pliego (`design/conext-logo/`); no hay
// dependencia de la fuente en runtime. `public/conext-logo.svg` tiene los
// mismos contornos: son tres copias del mismo trazado y se retocan las tres.
//
// La luna mide 1.2 veces la altura de x y se apoya en la línea de base, así que
// sobresale como una mayúscula. Va centrada en el hueco que dejó la "c", que es
// más angosto que ella: las puntas se meten en el espacio lateral de la "o" sin
// llegar a tocarla, que es exactamente el kerning que pide el par. Correrla
// hasta dejar el espacio "correcto" abre un agujero — una luna no llena su caja
// como la letra que reemplaza.
//
// Sin `width`/`height` en el SVG: con el `viewBox` solo, `h-7 w-auto` mide
// la proporción de la tinta y saca el ancho de ahí.

export default function Logo({ className = '' }) {
  return (
    <svg
      viewBox="-16.7553 -673 3164.7553 683"
      fill="currentColor"
      role="img"
      aria-label="conext"
      className={`logo-marca ${className}`.trim()}
    >
      <path d="M 390 128 C 300 56, 126 88, 96 232 C 68 352, 190 474, 392 384 C 232 424, 150 342, 166 252 C 182 164, 300 118, 390 128 Z" transform="translate(-197.2859 -804.4111) scale(1.9618)" />
      <path d="M821 10Q740 10 678.5 -24Q617 -58 583 -118.5Q549 -179 549 -257Q549 -335 583 -394Q617 -453 678.5 -486.5Q740 -520 821 -520Q903 -520 964 -486.5Q1025 -453 1059 -394Q1093 -335 1093 -257Q1093 -179 1058.5 -118.5Q1024 -58 963 -24Q902 10 821 10ZM821 -91Q861 -91 893 -111.5Q925 -132 943 -169.5Q961 -207 961 -258Q961 -333 921.5 -376Q882 -419 821 -419Q760 -419 720 -376Q680 -333 680 -258Q680 -207 698.5 -169.5Q717 -132 748.5 -111.5Q780 -91 821 -91Z" />
      <path d="M1156 0L1156 -510L1279 -510L1279 -390L1282 -390L1282 0L1156 0ZM1514 0L1514 -322Q1514 -369 1490 -393Q1466 -417 1420 -417Q1380 -417 1348.5 -399Q1317 -381 1299.5 -349Q1282 -317 1282 -275L1269 -397Q1295 -453 1345 -486.5Q1395 -520 1465 -520Q1548 -520 1594.5 -473Q1641 -426 1641 -348L1641 0L1514 0Z" />
      <path d="M1967 10Q1886 10 1825.5 -24Q1765 -58 1731.5 -118Q1698 -178 1698 -256Q1698 -334 1731.5 -393.5Q1765 -453 1825 -486.5Q1885 -520 1965 -520Q2041 -520 2097 -488.5Q2153 -457 2184 -400Q2215 -343 2215 -267Q2215 -253 2214 -241Q2213 -229 2211 -217L1776 -217L1776 -305L2114 -305L2088 -281Q2088 -353 2055 -389Q2022 -425 1963 -425Q1899 -425 1861.5 -381Q1824 -337 1824 -254Q1824 -172 1861.5 -128.5Q1899 -85 1968 -85Q2008 -85 2038 -100Q2068 -115 2082 -146L2201 -146Q2176 -74 2116.5 -32Q2057 10 1967 10Z" />
      <path d="M2629 0L2472 -228L2260 -510L2403 -510L2545 -303L2772 0L2629 0ZM2482 -307L2625 -510L2765 -510L2543 -219L2482 -307ZM2532 -213L2378 0L2239 0L2472 -302L2532 -213Z" />
      <path d="M3065 10Q2971 10 2926.5 -34.5Q2882 -79 2882 -168L2882 -626L3009 -673L3009 -165Q3009 -128 3029 -110Q3049 -92 3092 -92Q3109 -92 3122.5 -94.5Q3136 -97 3148 -101L3148 -3Q3136 3 3114 6.5Q3092 10 3065 10ZM2784 -411L2784 -510L3148 -510L3148 -411L2784 -411Z" />
    </svg>
  )
}
