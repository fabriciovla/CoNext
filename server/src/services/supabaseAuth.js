// Verificación del token de sesión que emite Supabase Auth.
//
// La dashboard ya entra con Google/GitHub (`src/lib/auth.js`), pero ese login
// vivía solo en el navegador: decía qué dibujar y nada más. Acá es donde ese
// token empieza a valer, y es lo que reemplaza a la API key cuando la request
// viene de una persona y no de un script.
//
// Se valida preguntándole a Supabase (`GET /auth/v1/user`) en vez de verificar
// la firma acá. El motivo es no tener que administrar un secreto más: el JWT
// secret del proyecto no está en el .env, y los proyectos nuevos firman con
// claves asimétricas que además rotan. Con esto alcanza la URL y la anon key,
// que ya están cargadas.
//
// El costo de esa decisión es una llamada HTTP por request, y la dashboard
// hace cuatro cada seis segundos: por eso el resultado se cachea en memoria.
// El TTL es corto a propósito — es el tiempo que puede seguir entrando alguien
// a quien le acaban de cerrar la sesión.
const TTL_MS = 60_000

// Un token vencido o falso no cambia de opinión: cachear el "no" evita que un
// cliente colgado con una sesión vieja golpee Supabase cuatro veces cada seis
// segundos.
const TTL_INVALIDO_MS = 15_000

const cache = new Map()

function leerConfig() {
  const url = String(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').trim()
  const anon = String(process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anon) return null
  return { url: url.replace(/\/$/, ''), anon }
}

export function authDisponible() {
  return Boolean(leerConfig())
}

// El nombre para mostrar sale de los mismos campos que usa la dashboard, en el
// mismo orden, para que la persona se vea igual escrita de los dos lados.
function nombreDe(user) {
  const meta = user.user_metadata ?? {}
  return String(
    meta.full_name || meta.name || meta.user_name || (user.email ?? '').split('@')[0] || 'cuenta',
  ).trim()
}

function limpiarVencidos(ahora) {
  for (const [clave, entrada] of cache) {
    if (entrada.vence <= ahora) cache.delete(clave)
  }
}

// Devuelve { id, email, displayName } o null. Nunca lanza por un token malo:
// un 401 de Supabase es una respuesta válida a "¿este token sirve?".
export async function usuarioDeToken(token) {
  const cfg = leerConfig()
  if (!cfg || !token) return null

  const ahora = Date.now()
  const cacheado = cache.get(token)
  if (cacheado && cacheado.vence > ahora) return cacheado.user

  // El Map crece con cada token distinto que pasa por acá; sin esto, una sesión
  // que renueva su token cada hora deja la entrada vieja adentro para siempre.
  if (cache.size > 500) limpiarVencidos(ahora)

  let res
  try {
    res = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.anon, Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    // Supabase caído o sin red. No es lo mismo que un token inválido, así que
    // se propaga: quien llama responde 503 y no 401, que mandaría a la persona
    // a iniciar sesión de nuevo para nada.
    const error = new Error('No se pudo verificar la sesión contra Supabase')
    error.causa = err
    error.status = 503
    throw error
  }

  if (!res.ok) {
    cache.set(token, { user: null, vence: ahora + TTL_INVALIDO_MS })
    return null
  }

  const data = await res.json().catch(() => null)
  if (!data?.id) {
    cache.set(token, { user: null, vence: ahora + TTL_INVALIDO_MS })
    return null
  }

  const user = {
    id: data.id,
    email: String(data.email ?? '').trim(),
    displayName: nombreDe(data),
  }
  cache.set(token, { user, vence: ahora + TTL_MS })
  return user
}

// Al cerrar sesión no hay nada que invalidar del lado del server (el token
// sigue siendo válido hasta que vence), pero sí conviene soltar la entrada.
export function olvidarToken(token) {
  cache.delete(token)
}
