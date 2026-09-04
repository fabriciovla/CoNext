import {
  PRODUCTO_COLUMNAS,
  PRODUCTO_PAGINAS,
  paginaProducto,
  slugsDeColumna,
  slugsProducto,
} from './producto.js'
import { COMPARAR_PAGINAS, paginaComparar, slugsComparar } from './comparar.js'
import { INTEGRACIONES_PAGINAS, paginaIntegracion, slugsIntegraciones } from './integraciones.js'
import { DOCS_PAGINAS, paginaDoc, slugsDocs } from './docs.js'

// Registro de las secciones de contenido del sitio. El artículo, el índice y
// las rutas dinámicas leen de acá: una sección nueva es una entrada, no tres
// vistas copiadas.

export const SECCIONES = {
  producto: {
    path: '/producto',
    i18n: 'producto',
    paginas: PRODUCTO_PAGINAS,
    columnas: PRODUCTO_COLUMNAS,
    meta: paginaProducto,
    slugs: slugsProducto,
    slugsDeColumna,
  },
  comparar: {
    path: '/comparar',
    i18n: 'comparar',
    paginas: COMPARAR_PAGINAS,
    meta: paginaComparar,
    slugs: slugsComparar,
  },
  integraciones: {
    path: '/integraciones',
    i18n: 'integraciones',
    paginas: INTEGRACIONES_PAGINAS,
    meta: paginaIntegracion,
    slugs: slugsIntegraciones,
  },
  docs: {
    path: '/docs',
    i18n: 'docs',
    paginas: DOCS_PAGINAS,
    meta: paginaDoc,
    slugs: slugsDocs,
  },
}
