import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client'

export default function useProducts() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    apiGet('/products').then(setProducts).catch((err) => console.error('[useProducts]', err))
  }, [])

  const addProduct = (product) => {
    apiPost('/products', product)
      .then((created) => setProducts((prev) => [...prev, created]))
      .catch((err) => console.error('[useProducts] addProduct', err))
  }

  const updateProduct = (id, changes) => {
    apiPut(`/products/${id}`, changes)
      .then((updated) => setProducts((prev) => prev.map((p) => (p.id === id ? updated : p))))
      .catch((err) => console.error('[useProducts] updateProduct', err))
  }

  const deleteProduct = (id) => {
    apiDelete(`/products/${id}`)
      .then(() => setProducts((prev) => prev.filter((p) => p.id !== id)))
      .catch((err) => console.error('[useProducts] deleteProduct', err))
  }

  return { products, addProduct, updateProduct, deleteProduct }
}
