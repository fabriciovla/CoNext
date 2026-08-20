import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import PageActions from '../components/PageActions'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import ProductForm from '../components/ProductForm'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconBox,
  IconFolder,
  IconSearch,
  IconClose,
} from '../components/ui/icons'
import { inventoryValue, STOCK_BAJO } from '../utils/metrics'

const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const compacto = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const TODOS = 'todos'
const SUELTOS = 'sueltos'

// El stock del renglón de abajo. Con stock normal es un número y nada más: el
// punto de color se guarda para cuando hay algo que hacer, que es lo mismo que
// hacen las alertas de Inicio. Y el "quedan 5" va con el rótulo en vez de en una
// columna aparte, porque suelto no se sabía si era stock, precio o unidades.
function stockLine(stock) {
  if (stock === 0) return <Badge tone="red">Sin stock</Badge>
  // El umbral es el de `metrics`, el mismo que dispara las alertas de Inicio:
  // un producto no puede estar "bajo" en una pantalla y normal en la otra.
  if (stock <= STOCK_BAJO) return <Badge tone="amber">Stock bajo, quedan {stock}</Badge>
  return <span className="tabular-nums">{stock} en stock</span>
}

function IconAction({ title, onClick, danger = false, box = 'h-6 w-6', children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex ${box} items-center justify-center rounded-md text-ink-muted transition-colors duration-150 ${
        danger ? 'hover:bg-status-critical/10 hover:text-status-critical' : 'hover:bg-tint/[0.06] hover:text-ink-primary'
      }`}
    >
      {children}
    </button>
  )
}

// Número del pie: el rótulo arriba en chico y el dato abajo. Misma forma que
// los totales de Agentes, para que el catálogo cierre igual que el resto.
function Dato({ label, value, tone = 'text-ink-primary', align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className="text-[12px] text-ink-muted">{label}</p>
      <p className={`text-[15px] font-semibold leading-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

// Chip del encabezado: filtra la lista por estado de stock. Activo se marca
// con fondo, no con un color de estado extra — el punto del Badge ya dice
// si es crítico o bajo.
function FilterChip({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md px-1.5 py-0.5 transition-colors duration-150
        ${active ? 'bg-tint/[0.08]' : 'hover:bg-tint/[0.05]'}`}
    >
      {children}
    </button>
  )
}

// Fila del catálogo: dos renglones y no una fila de tabla.
//
// Como tabla eran tres columnas angostas repartidas en una tarjeta ancha, así
// que entre el nombre y sus números quedaba medio renglón de aire y el ojo tenía
// que cruzarlo para saber cuánto sale cada cosa. Acá el precio —que es lo que se
// viene a buscar— sube al primer renglón, contra el nombre, y la carpeta y el
// stock bajan a una línea secundaria.
//
// Tocar la fila abre el producto, igual que una tarjeta de agente: editar es lo
// que se hace acá seguido. Borrar se queda al pasar el mouse, en el hueco que
// deja el precio, para que aparecer no mueva nada de su lugar. Arrastrar hasta
// una carpeta sigue siendo de la fila entera.
function ProductRow({ product, i, arrastrado, onEdit, onDelete, dragProps }) {
  return (
    <li
      {...dragProps}
      tabIndex={0}
      onClick={(e) => {
        if (e.target.closest('button')) return
        onEdit()
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
      className={`group animate-fade-up flex cursor-pointer items-center gap-4 px-4 py-3
        transition-colors duration-150 hover:bg-tint/[0.03] active:cursor-grabbing
        focus-visible:outline-none focus-visible:bg-tint/[0.03]
        ${arrastrado ? 'opacity-40' : ''}`}
      // Tope de 8 filas escalonadas: más abajo el retraso se volvería espera.
      style={{ '--d': `${Math.min(i, 8) * 45}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-ink-primary" title={product.name}>
          {product.name}
        </p>
        {/* Alto fijo en los dos renglones de abajo (el de acá y el de borrar)
            para que la fila mida lo mismo con y sin el mouse encima. */}
        <div className="flex h-5 items-center gap-1.5 text-[12px] text-ink-muted">
          {product.folderName && (
            <>
              <span className="min-w-0 shrink truncate">{product.folderName}</span>
              <span className="shrink-0 text-ink-faint">·</span>
            </>
          )}
          <span className="shrink-0">{stockLine(product.stock)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[13.5px] font-semibold tabular-nums text-ink-primary">
          {currency.format(product.price)}
        </p>
        <div className="flex h-5 items-center justify-end opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <IconAction
            box="h-5 w-5"
            title={`Eliminar ${product.name}`}
            danger
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <IconTrash size={13} />
          </IconAction>
        </div>
      </div>
    </li>
  )
}

function FolderRow({ icon, label, count, active, dropActive, arrastrando, onSelect, actions, dropProps }) {
  return (
    <div
      {...dropProps}
      className={`group relative flex h-8 items-center gap-2 rounded-md px-2 text-[13px] transition-colors duration-150
        ${
          dropActive
            ? 'bg-violet-soft text-violet ring-1 ring-violet/40'
            : active
              ? 'bg-violet-soft font-medium text-ink-primary'
              : `text-ink-muted hover:bg-tint/[0.05] hover:text-ink-primary ${
                  arrastrando && dropProps ? 'ring-1 ring-violet/20' : ''
                }`
        }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver ${label}`}
        aria-current={active ? 'page' : undefined}
        className="absolute inset-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
      />
      <span className="pointer-events-none relative shrink-0">{icon}</span>
      <span className="pointer-events-none relative min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>

      <span className="relative grid shrink-0 place-items-end">
        <span
          className={`pointer-events-none col-start-1 row-start-1 text-[11.5px] tabular-nums transition-opacity duration-150
            ${dropActive ? 'text-violet' : active ? 'text-ink-primary' : 'text-ink-faint'}
            ${actions ? 'group-hover:opacity-0 group-focus-within:opacity-0' : ''}`}
        >
          {count}
        </span>
        {actions && (
          <span className="col-start-1 row-start-1 flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            {actions}
          </span>
        )}
      </span>
    </div>
  )
}

function FolderModal({ folder, onSubmit, onClose }) {
  const [name, setName] = useState(folder?.name ?? '')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const limpio = name.trim()
    if (!limpio || guardando) return
    setGuardando(true)
    onSubmit(limpio)
      .then(onClose)
      .catch((err) => {
        setError(err.message)
        setGuardando(false)
      })
  }

  return (
    <Modal title={folder ? 'Renombrar carpeta' : 'Nueva carpeta'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="folder-name"
          label="Nombre"
          autoFocus
          maxLength={40}
          placeholder="Bebidas"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
        {error && <p className="text-[12.5px] leading-snug text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {folder ? 'Guardar' : 'Crear carpeta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Products({
  // Las dos listas arrancan vacías: el hook las pide al montar y el primer
  // render pasa antes de que contesten.
  products = [],
  folders = [],
  error,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}) {
  const [view, setView] = useState(TODOS)
  const [search, setSearch] = useState('')
  const [stockFiltro, setStockFiltro] = useState(null)
  const [modalMode, setModalMode] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [folderModal, setFolderModal] = useState(null)
  const [confirmFolder, setConfirmFolder] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dropKey, setDropKey] = useState(null)

  const counts = useMemo(() => {
    const acumulado = new Map()
    for (const p of products) acumulado.set(p.folderId, (acumulado.get(p.folderId) ?? 0) + 1)
    return acumulado
  }, [products])

  // La carpeta primero: los chips de stock cuentan sobre lo que hay adentro,
  // no sobre el catálogo entero, para que "sin stock" de una carpeta vacía de
  // alertas no muestre el número de otra.
  const enCarpeta = useMemo(() => {
    if (view === TODOS) return products
    if (view === SUELTOS) return products.filter((p) => !p.folderId)
    return products.filter((p) => p.folderId === view)
  }, [products, view])

  const sinStockCarpeta = useMemo(() => enCarpeta.filter((p) => p.stock === 0).length, [enCarpeta])
  const bajoCarpeta = useMemo(
    () => enCarpeta.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO).length,
    [enCarpeta],
  )

  const visibles = useMemo(() => {
    const porStock =
      stockFiltro === 'cero'
        ? enCarpeta.filter((p) => p.stock === 0)
        : stockFiltro === 'bajo'
          ? enCarpeta.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO)
          : enCarpeta

    const q = search.trim().toLowerCase()
    return q ? porStock.filter((p) => p.name.toLowerCase().includes(q)) : porStock
  }, [enCarpeta, search, stockFiltro])

  const carpetaActual = folders.find((f) => f.id === view) ?? null
  const titulo = view === TODOS ? 'Todos los productos' : view === SUELTOS ? 'Sin carpeta' : carpetaActual?.name
  const sueltos = counts.get(null) ?? 0
  const sinStock = visibles.filter((p) => p.stock === 0).length
  const bajo = visibles.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO).length
  // Productos que hay dentro de la carpeta que se está por eliminar.
  const adentro = confirmFolder ? (counts.get(confirmFolder.id) ?? 0) : 0

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
    const accion = modalMode === 'edit' && editingProduct ? onUpdate(editingProduct.id, data) : onAdd(data)
    accion.then(closeModal).catch(() => {})
  }

  const handleDelete = () => {
    onDelete(confirmDelete.id)
      .then(() => setConfirmDelete(null))
      .catch(() => {})
  }

  const handleFolderSubmit = (name) =>
    folderModal === 'nueva'
      ? onAddFolder(name).then((creada) => setView(creada.id))
      : onRenameFolder(folderModal.id, name)

  const handleDeleteFolder = () => {
    const id = confirmFolder.id
    onDeleteFolder(id)
      .then(() => {
        if (view === id) setView(TODOS)
        setConfirmFolder(null)
      })
      .catch(() => setConfirmFolder(null))
  }

  const soltar = (folderId) => (e) => {
    e.preventDefault()
    const id = dragging ?? e.dataTransfer.getData('text/plain')
    setDragging(null)
    setDropKey(null)
    const producto = products.find((p) => p.id === id)
    if (!producto || producto.folderId === folderId) return
    onMove(id, folderId).catch(() => {})
  }

  const dropProps = (key, folderId) => ({
    onDragOver: (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    onDragEnter: () => setDropKey(key),
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setDropKey((actual) => (actual === key ? null : actual))
    },
    onDrop: soltar(folderId),
  })

  // Lo que se le cuelga a cada fila para poder arrastrarla hasta una carpeta.
  const arrastreDe = (product) => ({
    draggable: true,
    onDragStart: (e) => {
      if (e.target.closest('button')) {
        e.preventDefault()
        return
      }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', product.id)
      setDragging(product.id)
    },
    onDragEnd: () => {
      setDragging(null)
      setDropKey(null)
    },
  })

  // La lista vacía es el único cartel de la sección, así que dice por qué está
  // vacía en cada caso y no una frase que sirva para todos. El del catálogo sin
  // nada arriba es además el primero que ve un cliente nuevo: ahí lo que hace
  // falta no es avisar que la lista está vacía —eso ya se ve— sino qué se pierde
  // mientras siga así.
  const emptyMessage = search.trim()
    ? `Ningún producto coincide con “${search.trim()}”.`
    : stockFiltro === 'cero'
      ? 'Ninguno se quedó sin stock en esta vista.'
      : stockFiltro === 'bajo'
        ? 'Ninguno tiene el stock bajo en esta vista.'
        : view === SUELTOS
          ? 'Todos los productos están guardados en alguna carpeta.'
          : carpetaActual
            ? 'La carpeta está vacía. Arrastrá un producto hasta acá para moverlo.'
            : 'Todavía no cargaste productos. Hasta que haya alguno, tus agentes no pueden contestar por precios ni por stock.'

  const catalogoVacio = products.length === 0 && !search.trim() && !stockFiltro

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0">
        <PageHeader title="Productos" />
      </div>

      {error && (
        <p className="mb-4 shrink-0 rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      {/* Una sola tarjeta a todo el ancho de la página: las carpetas son el
          riel de la izquierda, no otra tarjeta al costado. El borde interno
          separa navegar de trabajar, y el pie cierra las dos columnas juntas.
          Llena la altura que deja el título: scrollean el listado y, si hace
          falta, las carpetas; el buscador y los totales se quedan a la vista. */}
      <Card
        bodyClassName="flex min-h-0 min-w-0 flex-1 flex-col p-0"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        {/* Una sola barra para toda la tarjeta. Antes había dos encabezados a
            la misma altura — "Carpetas" a la izquierda y el título a la
            derecha — y el hueco entre el nombre y los filtros se leía como
            un recuadro a medias. El título y las alertas van juntos (hablan
            de esta vista); el buscador se queda a la derecha. */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-tint/[0.06] bg-tint/[0.02] px-4">
          <h2 className="min-w-0 truncate text-[13px] font-semibold text-ink-primary">{titulo}</h2>
          <div className="flex min-w-0 items-center gap-0.5">
            {(sinStockCarpeta > 0 || stockFiltro === 'cero') && (
              <FilterChip
                active={stockFiltro === 'cero'}
                title={stockFiltro === 'cero' ? 'Mostrar todos' : 'Ver solo los que no tienen stock'}
                onClick={() => setStockFiltro((f) => (f === 'cero' ? null : 'cero'))}
              >
                <Badge tone="red">Sin stock {sinStockCarpeta}</Badge>
              </FilterChip>
            )}
            {(bajoCarpeta > 0 || stockFiltro === 'bajo') && (
              <FilterChip
                active={stockFiltro === 'bajo'}
                title={stockFiltro === 'bajo' ? 'Mostrar todos' : 'Ver solo los de stock bajo'}
                onClick={() => setStockFiltro((f) => (f === 'bajo' ? null : 'bajo'))}
              >
                <Badge tone="amber">Stock bajo {bajoCarpeta}</Badge>
              </FilterChip>
            )}
          </div>
          <div className="relative ml-auto shrink-0">
            <IconSearch
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar producto"
              className="w-52 rounded-lg border border-tint/[0.12] bg-transparent py-1.5 pl-8 pr-7 text-[12px] text-ink-primary
                placeholder:text-ink-faint transition-colors duration-150
                focus:border-violet/60 focus:outline-none focus:ring-1 focus:ring-violet/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded
                  text-ink-faint transition-colors duration-150 hover:text-ink-primary
                  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet/50"
              >
                <IconClose size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
          <aside className="flex min-h-0 max-h-40 shrink-0 flex-col overflow-hidden border-b border-tint/[0.06] bg-tint/[0.02] md:max-h-none md:w-[208px] md:border-b-0 md:border-r">
            <p
              className={`shrink-0 truncate px-3.5 pb-1 pt-2.5 text-[12px] ${
                dragging ? 'text-violet' : 'text-ink-muted'
              }`}
            >
              {dragging ? 'Soltá para mover' : 'Carpetas'}
            </p>

            <nav aria-label="Carpetas del catálogo" className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
              <FolderRow
                icon={<IconBox size={15} />}
                label="Todos"
                count={products.length}
                active={view === TODOS}
                onSelect={() => setView(TODOS)}
              />

              {folders.length > 0 && (
                <>
                  <div className="mx-2 mb-2 mt-4 h-px bg-tint/[0.07]" />
                  <div className="space-y-px">
                    {folders.map((folder) => (
                      <FolderRow
                        key={folder.id}
                        icon={<IconFolder size={15} />}
                        label={folder.name}
                        count={counts.get(folder.id) ?? 0}
                        active={view === folder.id}
                        dropActive={dropKey === folder.id}
                        arrastrando={Boolean(dragging)}
                        onSelect={() => setView(folder.id)}
                        dropProps={dropProps(folder.id, folder.id)}
                        actions={
                          <>
                            <IconAction box="h-5 w-5" title={`Renombrar ${folder.name}`} onClick={() => setFolderModal(folder)}>
                              <IconPencil size={13} />
                            </IconAction>
                            <IconAction box="h-5 w-5" title={`Eliminar ${folder.name}`} danger onClick={() => setConfirmFolder(folder)}>
                              <IconTrash size={13} />
                            </IconAction>
                          </>
                        }
                      />
                    ))}

                    {(sueltos > 0 || dragging) && (
                      <FolderRow
                        icon={<IconFolder size={15} />}
                        label="Sin carpeta"
                        count={sueltos}
                        active={view === SUELTOS}
                        dropActive={dropKey === SUELTOS}
                        arrastrando={Boolean(dragging)}
                        onSelect={() => setView(SUELTOS)}
                        dropProps={dropProps(SUELTOS, null)}
                      />
                    )}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setFolderModal('nueva')}
                className="mt-1 flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-ink-faint
                  transition-colors duration-150 hover:bg-tint/[0.05] hover:text-ink-primary
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
              >
                <IconPlus size={15} className="shrink-0" />
                <span className="truncate">Nueva carpeta</span>
              </button>
            </nav>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {visibles.length === 0 ? (
              <div className="animate-fade-in flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-14 text-center">
                <span className="mb-3 text-ink-faint">
                  <IconBox size={28} />
                </span>
                <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{emptyMessage}</p>
                {catalogoVacio && (
                  <Button className="mt-4" onClick={openCreate}>
                    <IconPlus size={14} />
                    Nuevo producto
                  </Button>
                )}
              </div>
            ) : (
              <ul className="min-h-0 flex-1 divide-y divide-tint/[0.05] overflow-y-auto">
                {visibles.map((product, i) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    i={i}
                    arrastrado={dragging === product.id}
                    onEdit={() => openEdit(product)}
                    onDelete={() => setConfirmDelete(product)}
                    dragProps={arrastreDe(product)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <div className="flex shrink-0 items-end justify-between gap-4 border-t border-tint/[0.06] bg-tint/[0.02] px-4 py-3">
            <div className="flex min-w-0 gap-6">
              <Dato label="productos" value={visibles.length} />
              {sinStock > 0 && (
                <Dato label="sin stock" value={sinStock} tone="text-status-critical" />
              )}
              {bajo > 0 && stockFiltro !== 'cero' && (
                <Dato label="stock bajo" value={bajo} tone="text-status-warning" />
              )}
            </div>
            <Dato
              label="en inventario"
              value={compacto.format(inventoryValue(visibles))}
              align="right"
            />
          </div>
        )}
      </Card>

      {products.length > 0 && (
        <div className="shrink-0">
          <PageActions>
            <Button onClick={openCreate}>
              <IconPlus size={14} />
              Nuevo producto
            </Button>
          </PageActions>
        </div>
      )}

      {modalMode && (
        <Modal title={modalMode === 'edit' ? 'Editar producto' : 'Nuevo producto'} onClose={closeModal}>
          <ProductForm
            initial={editingProduct}
            folders={folders}
            defaultFolderId={carpetaActual?.id ?? null}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Eliminar producto" onClose={() => setConfirmDelete(null)}>
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Se va a eliminar <span className="text-ink-primary">{confirmDelete.name}</span>. Los
            agentes dejan de ofrecerlo cuando alguien pregunte por el catálogo.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </Modal>
      )}

      {folderModal && (
        <FolderModal
          key={folderModal === 'nueva' ? 'nueva' : folderModal.id}
          folder={folderModal === 'nueva' ? null : folderModal}
          onSubmit={handleFolderSubmit}
          onClose={() => setFolderModal(null)}
        />
      )}

      {confirmFolder && (
        <Modal title="Eliminar carpeta" onClose={() => setConfirmFolder(null)}>
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            Se va a eliminar la carpeta <span className="text-ink-primary">{confirmFolder.name}</span>.{' '}
            {/* La frase se arma en singular o en plural: con un solo producto
                adentro decía "Los 1 productos que tiene adentro no se borran". */}
            {adentro === 0
              ? 'No tiene productos adentro.'
              : adentro === 1
                ? 'El producto que tiene adentro no se borra: queda sin carpeta.'
                : `Los ${adentro} productos que tiene adentro no se borran: quedan sin carpeta.`}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmFolder(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteFolder}>
              Eliminar carpeta
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
