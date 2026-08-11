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
  welcomeMessage: '',
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
    updateSettings({
      daysOpen: settings.daysOpen.includes(day)
        ? settings.daysOpen.filter((d) => d !== day)
        : [...settings.daysOpen, day],
    })
  }

  return { settings, updateSettings, toggleDay }
}
