import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete } from '../api/client'

export default function useQuickReplies() {
  const [quickReplies, setQuickReplies] = useState([])

  useEffect(() => {
    apiGet('/quick-replies')
      .then(setQuickReplies)
      .catch((err) => console.error('[useQuickReplies]', err))
  }, [])

  // El backend, si el atajo ya existe, pisa el texto en vez de duplicar. Acá se
  // refleja igual: se reemplaza el que coincide o se agrega al final.
  const addQuickReply = (shortcut, text) =>
    apiPost('/quick-replies', { shortcut, text })
      .then((saved) => {
        setQuickReplies((prev) => {
          const exists = prev.some((q) => q.id === saved.id)
          return exists ? prev.map((q) => (q.id === saved.id ? saved : q)) : [...prev, saved]
        })
        return saved
      })
      .catch((err) => {
        console.error('[useQuickReplies] addQuickReply', err)
        return null
      })

  const deleteQuickReply = (id) =>
    apiDelete(`/quick-replies/${id}`)
      .then(() => setQuickReplies((prev) => prev.filter((q) => q.id !== id)))
      .catch((err) => console.error('[useQuickReplies] deleteQuickReply', err))

  return { quickReplies, addQuickReply, deleteQuickReply }
}
