import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete } from '../api/client'

// Las plantillas son el único caso donde la dashboard no manda sobre lo que
// muestra: viven en la cuenta de WhatsApp del cliente y quien las aprueba o
// rechaza es Meta, en su tiempo y por sus motivos. Por eso acá no hay estado
// optimista — se crea, se vuelve a preguntar, y lo que diga Graph es lo que se
// dibuja. Una plantilla que aparece "aprobada" porque la pintamos nosotros es
// una plantilla que va a fallar al mandarse.
export default function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [conectado, setConectado] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const refrescar = useCallback(
    () =>
      apiGet('/templates')
        .then((data) => {
          setTemplates(data.templates)
          setConectado(data.conectado)
          setError(null)
        })
        .catch((err) => {
          console.error('[useTemplates]', err)
          setError(err.message)
        })
        .finally(() => setCargando(false)),
    [],
  )

  useEffect(() => {
    refrescar()
  }, [refrescar])

  // Meta revisa las plantillas nuevas en minutos, a veces en horas. No hay
  // webhook que avise, así que el estado se actualiza al volver a pedirlas: el
  // botón de refrescar de la pantalla es lo que hay.
  const addTemplate = (template) =>
    apiPost('/templates', template).then(async (creada) => {
      await refrescar()
      return creada
    })

  const deleteTemplate = (name) =>
    apiDelete(`/templates/${encodeURIComponent(name)}`).then(() => refrescar())

  return { templates, conectado, cargando, error, refrescar, addTemplate, deleteTemplate }
}
