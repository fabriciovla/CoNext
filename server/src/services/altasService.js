import { randomUUID } from 'node:crypto'
import { one } from '../db/index.js'

const PLANES = new Set(['gratis', 'estandar', 'premium'])
const CLAVES = ['origen', 'origenOtro', 'rubro', 'rubroOtro', 'equipo', 'nombre', 'negocio']

function texto(valor, tope = 200) {
  if (valor == null) return null
  const s = String(valor).trim()
  if (!s) return null
  return s.slice(0, tope)
}

// El correo se guarda normalizado —recortado y en minúscula— porque es la clave
// con la que después se pregunta si esta persona ya contestó, y quien escribe
// `Ana@Gmail.com` al comprar escribe `ana@gmail.com` al entrar. Sin normalizar,
// las dos son cuentas distintas y la encuesta vuelve a saltar.
//
// La forma se valida flojo a propósito: acá no se está autenticando a nadie,
// solo evitando guardar como correo algo que no lo es.
export function normalizarCorreo(valor) {
  const s = texto(valor, 320)?.toLowerCase()
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return null
  return s
}

function limpiarRespuestas(crudo) {
  const src = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}
  const out = {}
  for (const clave of CLAVES) {
    const v = texto(src[clave])
    if (v) out[clave] = v
  }
  return out
}

// Lo que mira el login antes de dejar entrar: ¿esta cuenta ya pasó por el
// cuestionario? Devuelve un booleano y nada más —ni el alta ni el plan—: es un
// endpoint público, y contestar con el contenido sería regalar las respuestas
// de cualquiera que tipee un correo.
export async function contestoAlta(correo) {
  const limpio = normalizarCorreo(correo)
  if (!limpio) return false
  const fila = await one(`SELECT 1 AS hay FROM altas WHERE correo = $1 LIMIT 1`, [limpio])
  return Boolean(fila)
}

export async function guardarAlta({ plan, correo, respuestas }) {
  if (!PLANES.has(plan)) {
    const err = new Error('Plan inválido')
    err.status = 400
    throw err
  }

  const limpio = limpiarRespuestas(respuestas)
  if (!limpio.origen && !limpio.nombre && !limpio.negocio) {
    const err = new Error('Faltan respuestas')
    err.status = 400
    throw err
  }

  const id = `alta-${randomUUID()}`
  const now = new Date().toISOString()

  return one(
    `INSERT INTO altas (
       id, plan, correo, origen, rubro, equipo, nombre, negocio, respuestas, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
     RETURNING id, plan, created_at AS "createdAt"`,
    [
      id,
      plan,
      // Sin correo el alta se guarda igual: quien llega de una vuelta de Dodo
      // que no lo trajo contestó de verdad y ese dato no se tira. Lo que pierde
      // es el enganche con la cuenta, y ahí el corte lo hace el flag local.
      normalizarCorreo(correo),
      limpio.origen ?? null,
      limpio.rubro ?? null,
      limpio.equipo ?? null,
      limpio.nombre ?? null,
      limpio.negocio ?? null,
      JSON.stringify(limpio),
      now,
    ],
  )
}
