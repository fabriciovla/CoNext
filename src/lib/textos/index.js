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
// cuando el plural cambia también el resto de la frase—. Los pocos casos que
// hay no justifican un motor de plurales.
//
// Está partido por área y no en un solo archivo porque son más de seiscientas
// entradas: buscar el texto de una pantalla en un archivo de dos mil líneas es
// exactamente cómo termina habiendo dos claves para lo mismo.
//
// Las claves están en español porque el resto del código lo está. El idioma de
// las claves no se ve en ninguna pantalla.

import comun from './comun'
import bandeja from './bandeja'
import paginas from './paginas'
import config from './config'
import app from './app'

const TEXTOS = { ...comun, ...bandeja, ...paginas, ...config, ...app }

export default TEXTOS
