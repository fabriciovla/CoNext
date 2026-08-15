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

// Las dos columnas de la sección arrancan con un renglón de encabezado del mismo
// alto: la izquierda con el rótulo "Carpetas", la derecha con el título del
// listado y el buscador. Compartir la clase es lo que garantiza que la primera
// carpeta y el borde de arriba de la tarjeta queden a la misma altura. El alto
// es el del buscador, que es lo más alto que llevan las dos filas: si el renglón
// midiera menos, el campo sobresaldría por arriba y por abajo.
//
// El padding lateral NO va acá: cada encabezado copia el de su propia columna
// (`px-2.5` el de las carpetas, `px-4` el del listado) para caer sobre la misma
// línea vertical que lo que rotula. Sin eso, el título y el buscador quedaban
// contra el borde de la tarjeta mientras los nombres y los precios de adentro
// arrancaban 16px más adentro.
//
// El del listado lleva además `border-x border-transparent`: la tarjeta tiene
// borde de 1px, así que lo de adentro arranca a 17px de su borde exterior y no
// a 16. Es un borde invisible que solo está para copiarle la caja — con el
// padding solo, el título quedaba un pixel corrido de los nombres.
const FILA_ENCABEZADO = 'mb-3 flex h-8 items-center'

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

// Fila del catálogo: dos renglones y no una fila de tabla.
//
// Como tabla eran tres columnas angostas repartidas en una tarjeta ancha, así
// que entre el nombre y sus números quedaba medio renglón de aire y el ojo tenía
// que cruzarlo para saber cuánto sale cada cosa. Acá el precio —que es lo que se
// viene a buscar— sube al primer renglón, contra el nombre, y la carpeta y el
// stock bajan a una línea secundaria.
//
// Las dos columnas tienen dos renglones cada una: a la izquierda nombre y datos,
// a la derecha precio y los botones. Los botones caen justo en el hueco que dejó
// el precio, así que aparecer al pasar el mouse no mueve nada de su lugar.
function ProductRow({ product, i, arrastrado, onEdit, onDelete, dragProps }) {
  return (
    <li
      {...dragProps}
      className={`group animate-fade-up flex cursor-grab items-center gap-4 px-4 py-2.5
        transition-colors duration-150 hover:bg-tint/[0.03] active:cursor-grabbing
        ${arrastrado ? 'opacity-40' : ''}`}
      // Tope de 8 filas escalonadas: más abajo el retraso se volvería espera.
      style={{ '--d': `${Math.min(i, 8) * 45}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-ink-primary" title={product.name}>
          {product.name}
        </p>
        {/* Alto fijo en los dos renglones de abajo (el de acá y el de los
            botones) para que la fila mida lo mismo con y sin el mouse encima. */}
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
        <div className="flex h-5 items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <IconAction box="h-5 w-5" title={`Editar ${product.name}`} onClick={onEdit}>
            <IconPencil size={13} />
          </IconAction>
          <IconAction box="h-5 w-5" title={`Eliminar ${product.name}`} danger onClick={onDelete}>
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
      className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors duration-150
        ${
          dropActive
            ? 'bg-violet-soft text-violet ring-1 ring-violet/40'
            : active
              ? 'bg-tint/[0.09] font-medium text-ink-primary'
              : `text-ink-muted hover:bg-tint/[0.05] hover:text-ink-primary ${
                  arrastrando && dropProps ? 'ring-1 ring-tint/10' : ''
                }`
        }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver ${label}`}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
      />
      <span className="pointer-events-none relative shrink-0">{icon}</span>
      <span className="pointer-events-none relative min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>

      <span className="relative grid shrink-0 place-items-end">
        <span
          className={`pointer-events-none col-start-1 row-start-1 text-[11.5px] tabular-nums transition-opacity duration-150
            ${active ? 'text-ink-primary' : 'text-ink-faint'}
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

  const visibles = useMemo(() => {
    const base =
      view === TODOS
        ? products
        : view === SUELTOS
          ? products.filter((p) => !p.folderId)
          : products.filter((p) => p.folderId === view)

    const q = search.trim().toLowerCase()
    return q ? base.filter((p) => p.name.toLowerCase().includes(q)) : base
  }, [products, view, search])

  const carpetaActual = folders.find((f) => f.id === view) ?? null
  const titulo = view === TODOS ? 'Todos los productos' : view === SUELTOS ? 'Sin carpeta' : carpetaActual?.name
  const sueltos = counts.get(null) ?? 0
  const sinStock = visibles.filter((p) => p.stock === 0).length
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
    : view === SUELTOS
      ? 'Todos los productos están guardados en alguna carpeta.'
      : carpetaActual
        ? 'La carpeta está vacía. Arrastrá un producto hasta acá para moverlo.'
        : 'Todavía no cargaste productos. Hasta que haya alguno, tus agentes no pueden contestar por precios ni por stock.'

  return (
    <div>
      <PageHeader title="Productos" />

      <p className="mb-4 text-center text-[12.5px] text-ink-muted">
        {folders.length > 0
          ? 'Arrastrá un producto hasta una carpeta para moverlo.'
          : 'Agrupá el catálogo en carpetas: es también lo que le dice a tus agentes qué categorías vendés.'}
      </p>

      {error && (
        <p className="mx-auto mb-4 max-w-3xl rounded-xl border border-status-critical/25 bg-status-critical/10 px-4 py-2.5 text-[13px] text-status-critical">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <nav
          aria-label="Carpetas del catálogo"
          className="animate-fade-right shrink-0 md:sticky md:top-0 md:w-[212px]"
        >
          {/* Rótulo de la columna. Además de nombrarla, es lo que hace que la
              primera carpeta arranque a la misma altura que el borde de arriba
              de la tarjeta: el listado de la derecha tiene su propio renglón de
              título, y sin este las dos columnas empezaban desparejas. */}
          <div className={`${FILA_ENCABEZADO} px-2.5`}>
            <span className="text-[12px] text-ink-muted">Carpetas</span>
          </div>

          <div className="space-y-px">
            <FolderRow
              icon={<IconBox size={15} />}
              label="Todos"
              count={products.length}
              active={view === TODOS}
              onSelect={() => setView(TODOS)}
            />

            <div className="!my-2 h-px bg-tint/[0.07]" />

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
                    <IconAction title={`Renombrar ${folder.name}`} onClick={() => setFolderModal(folder)}>
                      <IconPencil size={13} />
                    </IconAction>
                    <IconAction title={`Eliminar ${folder.name}`} danger onClick={() => setConfirmFolder(folder)}>
                      <IconTrash size={13} />
                    </IconAction>
                  </>
                }
              />
            ))}

            {folders.length > 0 && (sueltos > 0 || dragging) && (
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

            <button
              type="button"
              onClick={() => setFolderModal('nueva')}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-ink-faint
                transition-colors duration-150 hover:bg-tint/[0.05] hover:text-ink-primary
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
            >
              <IconPlus size={15} className="shrink-0" />
              <span className="truncate">Nueva carpeta</span>
            </button>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          <div className={`${FILA_ENCABEZADO} justify-between gap-3 border-x border-transparent px-4`}>
            <h2 className="min-w-0 truncate text-[14px] font-semibold text-ink-primary">{titulo}</h2>
            <div className="relative shrink-0">
              <IconSearch
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto…"
                aria-label="Buscar producto"
                className="w-[190px] rounded-lg border border-tint/10 bg-tint/[0.04] py-1.5 pl-8 pr-7 text-[12px] text-ink-primary
                  placeholder:text-ink-faint transition-colors duration-200
                  focus:border-tint/25 focus:bg-tint/[0.07] focus:outline-none"
              />
              {/* Buscando dentro de una carpeta vacía la tabla queda sin filas,
                  y ahí la salida es borrar lo tipeado: sin esta cruz hay que
                  seleccionar el texto para darse cuenta de que el filtro sigue
                  puesto. Reserva el lugar con el `pr-7` del campo, así el texto
                  no se le mete abajo al aparecer. */}
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

          {/* `overflow-hidden` para que el fondo de la primera y la última fila
              no se coman las esquinas redondeadas de la tarjeta. */}
          <Card bodyClassName="p-0" className="overflow-hidden">
            {visibles.length === 0 ? (
              <p className="animate-fade-in px-6 py-10 text-center text-[13px] leading-relaxed text-ink-muted">
                {emptyMessage}
              </p>
            ) : (
              <ul className="divide-y divide-tint/[0.05]">
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

            {products.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-tint/[0.06] px-4 py-2.5 text-[12px]">
                <span className="text-ink-muted">
                  {visibles.length} producto{visibles.length === 1 ? '' : 's'}
                  {sinStock > 0 ? ` · ${sinStock} sin stock` : ''}
                </span>
                <span className="tabular-nums text-ink-secondary">
                  {compacto.format(inventoryValue(visibles))} en inventario
                </span>
              </div>
            )}
          </Card>
        </div>
      </div>

      <PageActions>
        <Button onClick={openCreate}>
          <IconPlus size={14} />
          Nuevo producto
        </Button>
      </PageActions>

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