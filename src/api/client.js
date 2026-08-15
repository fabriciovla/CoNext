const BASE = '/api'

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    // fetch solo rechaza si la conexión ni siquiera se pudo abrir: el server
    // está caído o reiniciando. El "Failed to fetch" pelado no dice nada, y es
    // justo el caso en el que toda la dashboard parece vacía sin explicación.
    throw new Error('No se pudo conectar con el server. ¿Está corriendo en el puerto 3001?')
  }

  if (!res.ok) {
    const message = await res.json().catch(() => null)
    throw new Error(message?.error || `${method} ${path} falló (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

// Subida de archivos. El body es un FormData y va sin Content-Type a mano: lo
// pone el navegador con el boundary del multipart, y escribirlo nosotros rompe
// el parseo del otro lado.
export async function apiUpload(path, formData) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData })
  } catch {
    throw new Error('No se pudo conectar con el server. ¿Está corriendo en el puerto 3001?')
  }
  if (!res.ok) {
    const message = await res.json().catch(() => null)
    throw new Error(message?.error || `POST ${path} falló (${res.status})`)
  }
  return res.json()
}

// URL del adjunto de un mensaje. Pasa por el proxy, así que viaja con la API
// key igual que cualquier otra request de la dashboard.
export const mediaUrl = (id) => `${BASE}/messages/media/${encodeURIComponent(id)}`

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body ?? {})
export const apiPut = (path, body) => request('PUT', path, body ?? {})
export const apiPatch = (path, body) => request('PATCH', path, body ?? {})
export const apiDelete = (path) => request('DELETE', path)
