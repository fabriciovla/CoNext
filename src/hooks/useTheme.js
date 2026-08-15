import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'wsp-crm:theme'
const DEFAULT = 'light'

// El tema se aplica poniendo `data-theme` en el <html>; index.css tiene los dos
// juegos de variables. El claro es el que vive en `:root` pelado, así que es
// también lo que se ve mientras carga el bundle: sin esto, entrar con el tema
// oscuro elegido pintaría un flash blanco en cada recarga (por eso index.html
// escribe el atributo antes de que arranque React).
function leerGuardado() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    return guardado === 'dark' || guardado === 'light' ? guardado : DEFAULT
  } catch {
    // Modo incógnito con almacenamiento bloqueado: no es motivo para romper.
    return DEFAULT
  }
}

export default function useTheme() {
  const [theme, setTheme] = useState(leerGuardado)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ver arriba */
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
