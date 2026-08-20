import { useState } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'

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
        label="Nombre"
        autoFocus
        placeholder="Coca-Cola 1.5 L"
        value={form.name}
        onChange={handleChange('name')}
        required
      />

      {/* Sin carpetas cargadas el campo no existe: sería un desplegable con una
          sola opción que dice que no hay nada para elegir. */}
      {folders.length > 0 && (
        <div>
          <span className="mb-1.5 block text-[12.5px] text-ink-secondary">Carpeta</span>
          <Select
            ariaLabel="Carpeta del producto"
            value={form.folderId ?? SIN_CARPETA}
            onChange={(value) => setForm((prev) => ({ ...prev, folderId: value || null }))}
            options={[
              { value: SIN_CARPETA, label: 'Sin carpeta' },
              ...folders.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="price"
          label="Precio"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={form.price}
          onChange={handleChange('price')}
        />
        <Input
          id="stock"
          label="Stock"
          type="number"
          min="0"
          placeholder="0"
          value={form.stock}
          onChange={handleChange('stock')}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
