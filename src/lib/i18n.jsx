import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import TEXTOS from './textos'

// El idioma de la dashboard. Es una preferencia de quien mira la pantalla —como
// el tema— y no del negocio: dos personas del mismo cliente pueden tener la app
// en idiomas distintos y no se pisan. Por eso vive en localStorage y no viaja
// al server. El idioma en el que la IA le contesta al cliente es otra cosa, se
// guarda en `settings.aiLanguage` y se configura aparte.
//
// No hay librería de i18n a propósito: el resto de la app tampoco tiene router
// ni librería de estado, y lo único que hace falta acá es buscar un texto por
// clave y elegir columna. Una dependencia traería carga de catálogos, plurales
// ICU y un formato de archivo, para el mismo resultado.

export const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

export const IDIOMA_POR_DEFECTO = 'es'
const CLAVES = IDIOMAS.map((i) => i.value)
const STORAGE_KEY = 'wsp-crm:idioma'

// El locale completo, que es otra cosa que el idioma: de acá salen el orden de
// la fecha, el separador decimal y los nombres de los meses. 'es-AR' y no 'es'
// pelado porque es lo que ya usaban las fechas de la app.
const LOCALES = { es: 'es-AR', en: 'en-US' }

export function localeDe(idioma) {
  return LOCALES[idioma] ?? LOCALES[IDIOMA_POR_DEFECTO]
}

// Sin nada guardado se mira el idioma del navegador. La primera visita de
// alguien con el sistema en inglés abre en inglés, que es lo que espera; para
// todos los que ya venían usando la app el navegador dice español y no cambia
// nada. Elegir a mano gana siempre, porque eso sí queda guardado.
function leerGuardado() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (CLAVES.includes(guardado)) return guardado
  } catch {
    // Modo incógnito con almacenamiento bloqueado: no es motivo para romper.
    return IDIOMA_POR_DEFECTO
  }
  const delNavegador = String(navigator.language ?? '').slice(0, 2).toLowerCase()
  return CLAVES.includes(delNavegador) ? delNavegador : IDIOMA_POR_DEFECTO
}

// Busca la clave separada por puntos: `t('bandeja.vacia.titulo')`. Devolver la
// clave cuando falta —y no una cadena vacía— es a propósito: un texto que no se
// tradujo se ve en la pantalla como `bandeja.vacia.titulo` y salta a la vista,
// mientras que un hueco vacío pasa por un espacio de diseño.
function buscar(clave) {
  let nodo = TEXTOS
  for (const parte of clave.split('.')) {
    if (nodo == null) return null
    nodo = nodo[parte]
  }
  return nodo
}

// Las hojas del diccionario son `{ es, en }`. El valor puede ser un texto con
// marcadores `{nombre}` o una función: la función es la salida para todo lo que
// no se resuelve reemplazando —los plurales, sobre todo, que en español y en
// inglés no se arman igual— sin meter un motor de plurales para tres casos.
export function traducir(idioma, clave, vars) {
  const hoja = buscar(clave)
  if (hoja == null) return clave

  const valor = hoja[idioma] ?? hoja[IDIOMA_POR_DEFECTO]
  if (valor == null) return clave
  if (typeof valor === 'function') return valor(vars ?? {})
  if (!vars) return valor

  return String(valor).replace(/\{(\w+)\}/g, (todo, nombre) =>
    Object.prototype.hasOwnProperty.call(vars, nombre) ? String(vars[nombre]) : todo,
  )
}

const IdiomaContext = createContext(null)

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(leerGuardado)

  useEffect(() => {
    // `lang` en el <html> no es decorativo: de ahí salen el corrector
    // ortográfico del navegador, la voz de un lector de pantalla y el guionado.
    document.documentElement.lang = idioma
    try {
      localStorage.setItem(STORAGE_KEY, idioma)
    } catch {
      /* ver leerGuardado */
    }
  }, [idioma])

  const valor = useMemo(() => {
    const locale = localeDe(idioma)
    return {
      idioma,
      setIdioma,
      locale,
      t: (clave, vars) => traducir(idioma, clave, vars),
      // La moneda es la del negocio (ARS) y no cambia con el idioma; lo que
      // cambia es el formato: dónde cae el símbolo y cuál es el separador de
      // miles. Va acá y no en cada pantalla porque la miran dos —el catálogo y
      // las alertas de Inicio— y con dos formateadores el mismo precio se leía
      // distinto en cada una.
      moneda: new Intl.NumberFormat(locale, { style: 'currency', currency: 'ARS' }),
    }
  }, [idioma])

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>
}

export function useIdioma() {
  const ctx = useContext(IdiomaContext)
  if (!ctx) throw new Error('useIdioma se usó fuera de <IdiomaProvider>')
  return ctx
}

// Atajo para el caso de siempre, que es querer solo la función de texto.
export function useT() {
  return useIdioma().t
}

// Formateadores atados al idioma activo. Se memorizan porque construir un
// `Intl.*Format` no es gratis y estos se llaman una vez por fila de una lista.
export function useFormato() {
  const { locale } = useIdioma()
  return useMemo(
    () => ({
      locale,
      fecha: (opciones) => new Intl.DateTimeFormat(locale, opciones),
      numero: (opciones) => new Intl.NumberFormat(locale, opciones),
    }),
    [locale],
  )
}
