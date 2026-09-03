import { useState } from 'react'
import Button from './ui/Button'
import Input, { LABEL_CLASS } from './ui/Input'
import Select from './ui/Select'
import { useT } from '../lib/i18n.jsx'

const EMPTY = { name: '', price: '', stock: '' }

// El desplegable compara valores por igualdad, así que "sin carpeta" viaja como
// cadena vacía y no como null: null no aparecería como opción elegida.
const SIN_CARPETA = ''

export default function ProductForm({
  initial,
  folders = [],
  // Creando un producto desde adentro de una carpeta, esa es la carpeta que
  // corresponde: es donde lo estaba buscando el admin cuando decidió cargarlo.
  defaultFolderId = null,
  onSubmit,
  onCancel,
}) {
  const t = useT()
  const [form, setForm] = useState(initial ?? { ...EMPTY, folderId: defaultFolderId })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      name: form.name.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      folderId: form.folderId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="stagger space-y-4">
      <Input
        id="name"
        label={t('productos.campoNombre')}
        autoFocus
        placeholder={t('productos.campoNombrePlaceholder')}
        value={form.name}
        onChange={handleChange('name')}
        required
      />

      {/* Sin carpetas cargadas el campo no existe: sería un desplegable con una
          sola opción que dice que no hay nada para elegir. */}
      {folders.length > 0 && (
        <div>
          <span className={LABEL_CLASS}>{t('productos.campoCarpeta')}</span>
          <Select
            ariaLabel={t('productos.campoCarpetaAria')}
            value={form.folderId ?? SIN_CARPETA}
            onChange={(value) => setForm((prev) => ({ ...prev, folderId: value || null }))}
            options={[
              { value: SIN_CARPETA, label: t('productos.sinCarpeta') },
              ...folders.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="price"
          label={t('productos.campoPrecio')}
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={form.price}
          onChange={handleChange('price')}
        />
        <Input
          id="stock"
          label={t('productos.campoStock')}
          type="number"
          min="0"
          placeholder="0"
          value={form.stock}
          onChange={handleChange('stock')}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('comun.cancelar')}
        </Button>
        <Button type="submit">{t('comun.guardar')}</Button>
      </div>
    </form>
  )
}
