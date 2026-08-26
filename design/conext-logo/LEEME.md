# conext — pliego de marca

`conext-logo.dc.html` es el canvas de diseño de donde salen el logotipo y los
íconos. Es un archivo autocontenido: los assets van adentro, comprimidos y en
base64, no como archivos sueltos. `assets/` guarda los dos que hacen falta
mirar de vez en cuando, ya desempaquetados.

Lo que se usa de acá:

- **la luna creciente** (`assets/conext-mark.svg`) es el isotipo. El contorno
  está copiado tal cual en `public/conext-mark.svg`, en `site/public/` y en las
  dos copias de `Logo.jsx`.
- **el nombre** va en Instrument Sans SemiBold con tracking `-0.03em`. En el
  código son contornos sacados de la tabla `glyf` del TTF, no `<text>`: el
  logotipo no depende de que la fuente esté instalada.
- **las proporciones del isologo horizontal**: caja de la marca 62, nombre a 52
  y 22 de aire entre las dos.

Lo que **no** se usa: el fondo cuadrado color crema (`#F7F2E8`) con el que el
pliego presenta el ícono de app (`assets/app-icon-512.png`). Los íconos del
proyecto son la marca sola, sin baldosa.

Esta carpeta está fuera de `public/` a propósito: `public/` se copia entero al
build y el material de diseño no tiene por qué quedar publicado en el dominio.
