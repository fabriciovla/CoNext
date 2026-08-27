import { clienteAuth } from '../lib/auth'

// En desarrollo la API se pide al mismo origen y la sirve el proxy de Vite, que
// de paso inyecta la API key. Publicada, la dashboard está en conext.lat/app y
// el server en otro dominio: ahí no hay proxy, la URL sale de VITE_API_URL y lo
// que autoriza es el token de la sesión.
const BASE = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '') || '/api'

// El token de Supabase Auth, si hay sesión. `getSession` lee de localStorage y
// renueva sola cuando está por vencer, así que no hace falta cachearlo acá — y
// cachearlo sería quedarse con el vencido.
async function cabeceras(extra) {
  const auth = clienteAuth()
  const token = auth ? (await auth.auth.getSession()).data.session?.access_token : null
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: await cabeceras(body !== undefined ? { 'Content-Type': 'application/json' } : undefined),
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
    res = await fetch(`${BASE}${path}`, { method: 'POST', headers: await cabeceras(), body: formData })
  } catch {
    throw new Error('No se pudo conectar con el server. ¿Está corriendo en el puerto 3001?')
  }
  if (!res.ok) {
    const message = await res.json().catch(() => null)
    throw new Error(message?.error || `POST ${path} falló (${res.status})`)
  }
  return res.json()
}

// El adjunto de un mensaje, ya descargado y convertido en una URL de blob.
//
// No se puede devolver la URL pelada y colgarla de un `<img src>`: una etiqueta
// no manda cabeceras, así que el token de la sesión no viaja y el server
// responde 401. En desarrollo funcionaba de casualidad, porque la clave la
// ponía el proxy de Vite sin que el navegador se enterara.
//
// Quien la use tiene que soltarla con URL.revokeObjectURL cuando termina, o el
// archivo queda en memoria hasta que se recargue la página.
export async function fetchMediaUrl(id) {
  const res = await fetch(`${BASE}/messages/media/${encodeURIComponent(id)}`, {
    headers: await cabeceras(),
  })
  if (!res.ok) throw new Error(`No se pudo traer el adjunto (${res.status})`)
  return URL.createObjectURL(await res.blob())
}

export const apiGet = (path) => request('GET', path)
export const apiPost = (path, body) => request('POST', path, body ?? {})
export const apiPut = (path, body) => request('PUT', path, body ?? {})
export const apiPatch = (path, body) => request('PATCH', path, body ?? {})
export const apiDelete = (path) => request('DELETE', path)
