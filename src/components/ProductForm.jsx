import { useState } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'

const EMPTY = { name: '', price: '', stock: '' }

export default function ProductForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY)

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
    })
  }

  return (
    <form onSubmit={handleSubmit} className="stagger space-y-4">
      <Input id="name" label="Nombre" value={form.name} onChange={handleChange('name')} required />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="price"
          label="Precio"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleChange('price')}
        />
        <Input
          id="stock"
          label="Stock"
          type="number"
          min="0"
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
