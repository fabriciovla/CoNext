import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPut, apiUpload } from '../api/client'

// El perfil que ve el cliente al abrir el chat: foto, descripción, dirección y
// datos de contacto. Vive en Meta, no en nuestra base, así que se lee en vivo
// en cada visita y no hay nada optimista — se guarda, se relee y se dibuja lo
// que haya quedado del otro lado. Mismo criterio que `useTemplates`.
//
// `codigo: 'sin-whatsapp'` no es un error a mostrar en rojo: es el estado
// normal de un cliente que todavía no conectó el canal, y la pantalla lo
// resuelve mandando a Canales.
export function useWhatsappProfile() {
  const [perfil, setPerfil] = useState(null)
  const [rubros, setRubros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [sinWhatsapp, setSinWhatsapp] = useState(false)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const r = await apiGet('/onboarding/whatsapp/profile')
      setPerfil(r.perfil)
      setRubros(r.rubros ?? [])
      setSinWhatsapp(false)
      setError(null)
    } catch (err) {
      // El server contesta 409 con ese código; el cliente solo ve el mensaje,
      // así que se reconoce por él. Es feo y es lo que hay hasta que
      // `request` propague el cuerpo entero.
      if (/no hay un whatsapp conectado/i.test(err.message)) setSinWhatsapp(true)
      else setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const guardar = useCallback(async (campos) => {
    setGuardando(true)
    setError(null)
    try {
      const r = await apiPut('/onboarding/whatsapp/profile', campos)
      setPerfil(r.perfil)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }, [])

  const subirFoto = useCallback(async (file) => {
    setGuardando(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await apiUpload('/onboarding/whatsapp/profile/photo', fd)
      setPerfil(r.perfil)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }, [])

  return { perfil, rubros, cargando, guardando, sinWhatsapp, error, guardar, subirFoto, recargar: cargar }
}
