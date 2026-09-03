import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../api/client'

// Same shape as the DB row, populated once GET /settings resolves. Keeping
// `daysOpen` as an array from the start avoids components crashing on
// `.includes()` during the brief window before the fetch completes.
const EMPTY_SETTINGS = {
  storeName: '',
  whatsappNumber: '',
  openTime: '',
  closeTime: '',
  daysOpen: [],
  timezone: '',
  weeklyHours: {},
  welcomeMessage: '',
  awayMessage: '',
  // El idioma en el que la IA le contesta al cliente. Arranca vacio y no en
  // 'es': con un valor puesto aca, guardar cualquier otra tarjeta antes de que
  // conteste el GET mandaria ese default y le pisaria el idioma al cliente.
  aiLanguage: '',
}

export default function useSettings() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    apiGet('/settings')
      .then(setSettings)
      .catch((err) => console.error('[useSettings]', err))
      .finally(() => setCargando(false))
  }, [])

  const updateSettings = (changes) => {
    const next = { ...settings, ...changes }
    setSettings(next) // optimistic: the composer keeps typing without waiting on the round trip
    apiPut('/settings', next)
      .then(setSettings)
      .catch((err) => console.error('[useSettings] updateSettings', err))
  }

  const toggleDay = (day) => {
    const current = settings.weeklyHours?.[day]
    updateSettings({
      weeklyHours: {
        ...settings.weeklyHours,
        [day]: current
          ? null
          : {
              openTime: settings.openTime || '09:00',
              closeTime: settings.closeTime || '18:00',
            },
      },
    })
  }

  return { settings, cargando, updateSettings, toggleDay }
}
