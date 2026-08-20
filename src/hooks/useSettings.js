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
  weeklyHours: {},
  welcomeMessage: '',
  awayMessage: '',
}

export default function useSettings() {
  const [settings, setSettings] = useState(EMPTY_SETTINGS)

  useEffect(() => {
    apiGet('/settings').then(setSettings).catch((err) => console.error('[useSettings]', err))
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

  return { settings, updateSettings, toggleDay }
}
