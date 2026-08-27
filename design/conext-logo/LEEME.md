# conext — pliego de marca

`conext-logo.dc.html` es el canvas de diseño de donde salen el logotipo y los
íconos. Es un archivo autocontenido: los assets van adentro, comprimidos y en
base64, no como archivos sueltos. `assets/` guarda los dos que hacen falta
mirar de vez en cuando, ya desempaquetados.

Lo que se usa de acá:

- **la marca**, las dos formas superpuestas (`assets/conext-mark.svg`). La
  geometría está copiada tal cual en `public/conext-mark.svg`, en
  `site/public/` y en las dos copias de `Logo.jsx`.
- **la baldosa crema** `#F7F2E8` con la que el pliego presenta el ícono de app
  (`assets/app-icon-512.png`), redondeada al 22% del lado. Es solo del ícono:
  el logotipo va sin fondo y toma el color del tema.

Lo que **no** se usa: **la tipografía del nombre**. El pliego lo dibuja en
Instrument Sans SemiBold; el logotipo del código lo escribe en **Satoshi
Medium**, que es la familia que usa todo el texto del sitio y de la app. Los
contornos salen de la tabla `glyf` del TTF, no de `<text>`: el logotipo no
depende de que la fuente esté instalada, y el peso queda clavado en Medium
aunque lo que se sirva sea el archivo variable.

Tampoco se usa la variante clara (`assets/conext-mark-light.svg`). El
pliego trae dos archivos porque un `<img>` no puede cambiar de color; el
componente dibuja el SVG en línea y sale de `currentColor`, y el hueco entre
las dos formas es una máscara y no un relleno, así que un solo dibujo sirve
para los dos temas.

Tampoco se usa el aire del isologo tal como está medido. El pliego separa la
marca del nombre por **cajas** (20 sobre un nombre de 50), y la marca trae 21%
de margen adentro de la suya: a la vista quedan 0.68 em de blanco y el
logotipo se lee como dos cosas sueltas. En el código el aire se mide entre
tintas, 0.30 em.

Esta carpeta está fuera de `public/` a propósito: `public/` se copia entero al
build y el material de diseño no tiene por qué quedar publicado en el dominio.
