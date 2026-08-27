import { useEffect, useState } from 'react'
import { fetchMediaUrl } from '../api/client'

// El `src` de un adjunto. Baja el archivo con la sesión puesta y devuelve una
// URL de blob, porque `<img>`, `<audio>` y `<video>` no mandan cabeceras y el
// server pide autorización como en cualquier otra request.
//
// La URL se revoca al desmontar: scrollear un hilo largo crearía una por
// mensaje y ninguna se liberaría sola. Volver a subir vuelve a pedir el
// archivo, pero eso lo resuelve el cache del navegador — la ruta de media
// responde con Cache-Control privado.
export default function useMediaSrc(id) {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return undefined

    let vigente = true
    let url = null

    setError(false)
    fetchMediaUrl(id)
      .then((creada) => {
        // Si el mensaje ya no está en pantalla, la URL se suelta acá mismo: sin
        // esto queda un blob colgado por cada adjunto que alcanzó a bajar
        // después de que la conversación cambió.
        if (!vigente) return URL.revokeObjectURL(creada)
        url = creada
        setSrc(creada)
      })
      .catch(() => {
        if (vigente) setError(true)
      })

    return () => {
      vigente = false
      if (url) URL.revokeObjectURL(url)
      setSrc(null)
    }
  }, [id])

  return { src, error }
}
