import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { IconCheck } from '../components/ui/icons'
import { weekDays } from '../data/mockData'

export default function Settings({ settings, onUpdate }) {
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)

  const handleChange = (field) => (e) => {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const toggleDay = (day) => {
    setSaved(false)
    setDraft((prev) => ({
      ...prev,
      daysOpen: prev.daysOpen.includes(day)
        ? prev.daysOpen.filter((d) => d !== day)
        : [...prev.daysOpen, day],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(draft)
    setSaved(true)
  }

  return (
    <div>
      <PageHeader title="Configuración de tienda" subtitle="Nombre, horarios y número de contacto" />

      <Card title="Datos de la tienda" className="max-w-xl">
        <form onSubmit={handleSubmit} className="stagger space-y-4" style={{ '--stagger-base': '60ms' }}>
          <Input id="storeName" label="Nombre de la tienda" value={draft.storeName} onChange={handleChange('storeName')} />

          <Input
            id="whatsappNumber"
            label="Número de WhatsApp"
            placeholder="+54 9 11 0000-0000"
            value={draft.whatsappNumber}
            onChange={handleChange('whatsappNumber')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input id="openTime" label="Apertura" type="time" value={draft.openTime} onChange={handleChange('openTime')} />
            <Input id="closeTime" label="Cierre" type="time" value={draft.closeTime} onChange={handleChange('closeTime')} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Días de atención
            </span>
            <div className="flex flex-wrap gap-1.5">
              {weekDays.map((day) => {
                const active = draft.daysOpen.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px active:scale-95 ${
                      active
                        ? 'border-transparent bg-white text-black'
                        : 'border-white/10 text-ink-muted hover:border-white/20 hover:text-ink-primary'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <label htmlFor="welcomeMessage" className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Mensaje de bienvenida
            </span>
            <textarea
              id="welcomeMessage"
              rows={3}
              value={draft.welcomeMessage}
              onChange={handleChange('welcomeMessage')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink-primary
                placeholder:text-ink-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </label>

          <label htmlFor="awayMessage" className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              Mensaje fuera de horario
            </span>
            <textarea
              id="awayMessage"
              rows={2}
              value={draft.awayMessage ?? ''}
              onChange={handleChange('awayMessage')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink-primary
                placeholder:text-ink-muted transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                focus:border-white/40 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-white/10"
            />
            <span className="mt-1.5 block text-xs text-ink-muted">
              Se envía solo cuando escriben fuera de los días y horarios de arriba. El bot no responde
              automáticamente en ese rato: deja la respuesta como borrador. Vacío = no se manda nada.
            </span>
          </label>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit">Guardar cambios</Button>
            {saved && (
              <span className="animate-pop-in flex items-center gap-1 text-xs font-medium text-status-good">
                <IconCheck size={13} />
                Cambios guardados
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
