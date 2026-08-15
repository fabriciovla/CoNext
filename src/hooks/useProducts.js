import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

// El catálogo y sus carpetas se piden juntos y viven juntos: casi todo lo que
// pasa en la sección toca los dos (mover un producto, borrar una carpeta), y
// separarlos en dos hooks obligaría a sincronizarlos desde la página.
//
// Las mutaciones devuelven la promesa, como en `useAgents`: el modal se cierra
// cuando el server confirmó, no cuando se apretó el botón.
export default function useProducts() {
  const [products, setProducts] = useState([])
  const [folders, setFolders] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([apiGet('/products'), apiGet('/products/folders')])
      .then(([productos, carpetas]) => {
        setProducts(productos)
        setFolders(carpetas)
      })
      .catch((err) => {
        console.error('[useProducts]', err)
        setError(err.message)
      })
  }, [])

  const fallar = (err) => {
    setError(err.message)
    throw err
  }

  // Crear y renombrar una carpeta fallan casi siempre por el nombre ("ya tenés
  // una carpeta con ese nombre"), y eso se contesta debajo del campo, que es
  // donde está el error. Si además prendieran el cartel de arriba, el mismo
  // texto aparecería dos veces en pantalla — y el de arriba seguiría ahí
  // después de corregir el nombre y guardar bien.
  const fallarEnElCampo = (err) => {
    throw err
  }

  const addProduct = (product) =>
    apiPost('/products', product)
      .then((created) => {
        setProducts((prev) => [...prev, created])
        setError(null)
        return created
      })
      .catch(fallar)

  const updateProduct = (id, changes) =>
    apiPut(`/products/${id}`, changes)
      .then((updated) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
        setError(null)
        return updated
      })
      .catch(fallar)

  const deleteProduct = (id) =>
    apiDelete(`/products/${id}`)
      .then(() => {
        setProducts((prev) => prev.filter((p) => p.id !== id))
        setError(null)
      })
      .catch(fallar)

  // Mover es la única mutación optimista de la sección, y es a propósito: se
  // dispara soltando un producto sobre una carpeta, y esperar la respuesta para
  // recién ahí sacarlo de la lista se siente como que el arrastre no funcionó.
  // Si el server lo rechaza, la lista vuelve a como estaba.
  const moveProduct = (id, folderId) => {
    const previo = products
    const folderName = folders.find((f) => f.id === folderId)?.name ?? null
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, folderId, folderName } : p)))

    return apiPut(`/products/${id}`, { folderId })
      .then((updated) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
        setError(null)
        return updated
      })
      .catch((err) => {
        setProducts(previo)
        return fallar(err)
      })
  }

  const addFolder = (name) =>
    apiPost('/products/folders', { name })
      .then((created) => {
        setFolders((prev) => [...prev, created])
        setError(null)
        return created
      })
      .catch(fallarEnElCampo)

  // El nombre de la carpeta viaja dentro de cada producto (así la fila lo puede
  // mostrar sin buscarlo), o sea que renombrar toca las dos listas. Si solo se
  // tocara la de carpetas, las filas seguirían mostrando el nombre viejo hasta
  // recargar.
  const renameFolder = (id, name) =>
    apiPut(`/products/folders/${id}`, { name })
      .then((updated) => {
        setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)))
        setProducts((prev) =>
          prev.map((p) => (p.folderId === id ? { ...p, folderName: updated.name } : p)),
        )
        setError(null)
        return updated
      })
      .catch(fallarEnElCampo)

  // El server saca los productos de la carpeta antes de borrarla; acá se hace
  // lo mismo con el estado local, o las filas quedarían apuntando a una carpeta
  // que ya no está en la columna.
  const deleteFolder = (id) =>
    apiDelete(`/products/folders/${id}`)
      .then(() => {
        setFolders((prev) => prev.filter((f) => f.id !== id))
        setProducts((prev) =>
          prev.map((p) => (p.folderId === id ? { ...p, folderId: null, folderName: null } : p)),
        )
        setError(null)
      })
      .catch(fallar)

  return {
    products,
    folders,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    addFolder,
    renameFolder,
    deleteFolder,
  }
}
