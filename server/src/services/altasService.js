import { one } from '../db/index.js'

const PLANES = new Set(['gratis', 'estandar', 'premium'])
const CLAVES = ['origen', 'origenOtro', 'rubro', 'rubroOtro', 'equipo', 'nombre', 'negocio']

function texto(valor, tope = 200) {
  if (valor == null) return null
  const s = String(valor).trim()
  if (!s) return null
  return s.slice(0, tope)
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

export async function guardarAlta({ plan, respuestas }) {
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

  const id = `alta-${crypto.randomUUID()}`
  const now = new Date().toISOString()

  return one(
    `INSERT INTO altas (
       id, plan, origen, rubro, equipo, nombre, negocio, respuestas, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     RETURNING id, plan, created_at AS "createdAt"`,
    [
      id,
      plan,
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
