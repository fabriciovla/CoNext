import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import ProductForm from '../components/ProductForm'
import { IconPlus } from '../components/ui/icons'

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

function stockBadge(stock) {
  if (stock === 0) return <Badge tone="red">Sin stock</Badge>
  if (stock <= 10) return <Badge tone="amber">Stock bajo</Badge>
  return <Badge tone="green">Disponible</Badge>
}

export default function Products({ products, onAdd, onUpdate, onDelete }) {
  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editingProduct, setEditingProduct] = useState(null)

  const openCreate = () => {
    setEditingProduct(null)
    setModalMode('create')
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingProduct(null)
  }

  const handleSubmit = (data) => {
    if (modalMode === 'edit' && editingProduct) {
      onUpdate(editingProduct.id, data)
    } else {
      onAdd(data)
    }
    closeModal()
  }

  const columns = [
    {
      key: 'name',
      header: 'Producto',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size={30} />
          <span className="font-medium text-ink-primary">{row.name}</span>
        </div>
      ),
    },
    { key: 'price', header: 'Precio', render: (row) => currency.format(row.price) },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{row.stock}</span>
          {stockBadge(row.stock)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(row.id)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Control de productos" subtitle="Nombre, precio y stock disponible" />

      <Card
        className="animate-scale-in"
        title="Productos"
        actions={
          <Button size="sm" onClick={openCreate}>
            <IconPlus size={14} />
            Nuevo producto
          </Button>
        }
      >
        <Table columns={columns} data={products} emptyMessage="Todavía no cargaste productos." />

        {modalMode && (
          <Modal title={modalMode === 'edit' ? 'Editar producto' : 'Nuevo producto'} onClose={closeModal}>
            <ProductForm initial={editingProduct} onSubmit={handleSubmit} onCancel={closeModal} />
          </Modal>
        )}
      </Card>
    </div>
  )
}
