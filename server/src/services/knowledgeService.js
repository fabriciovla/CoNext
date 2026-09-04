import crypto from 'node:crypto'
import { many, one, run } from '../db/index.js'

// Las fuentes con las que se entrena a un agente. Ver la migración 013: la
// fuente es del negocio y el interruptor es del agente.

// `content` no está en la lista a propósito: son hasta 40.000 caracteres por
// fuente y la pantalla nunca los muestra. Lo trae solo quien arma el prompt.
const COLUMNAS = `
  id, kind, title, origin, chars, created_at AS "createdAt", updated_at AS "updatedAt"
`

// Techo de lo que viaja al modelo por llamada. Cada fuente encendida se lee
// entera en CADA mensaje entrante, así que sin un tope el día que alguien sube
// diez manuales el prompt pasa a costar diez veces más — y calladamente. Cuando
// se pasa, se corta y el prompt lo dice: es preferible que el modelo sepa que
// hay algo que no está viendo a que crea que la lista está completa.
export const MAX_CHARS_PROMPT = 24_000

export async function getSources(tenantId) {
  return many(
    `SELECT ${COLUMNAS} FROM knowledge_sources WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  )
}

// Las fuentes del negocio con el interruptor de este agente ya resuelto. Es lo
// que dibuja la pantalla del agente: todas a la vista, encendidas las suyas.
export async function getSourcesForAgent(tenantId, agentId) {
  // Las columnas van con prefijo y no con `COLUMNAS`: `agent_knowledge` también
  // tiene `created_at`, así que sin el `s.` la consulta es ambigua y no corre.
  return many(
    `SELECT s.id, s.kind, s.title, s.origin, s.chars,
            s.created_at AS "createdAt", s.updated_at AS "updatedAt",
            (ak.agent_id IS NOT NULL) AS "enabled"
     FROM knowledge_sources s
     LEFT JOIN agent_knowledge ak
       ON ak.tenant_id = s.tenant_id AND ak.source_id = s.id AND ak.agent_id = $2
     WHERE s.tenant_id = $1
     ORDER BY s.created_at DESC`,
    [tenantId, agentId],
  )
}

// El texto que le toca a cada agente, listo para el prompt. Se pide por lista de
// keys y no de a uno porque el pipeline elige agente y redacta en la misma
// llamada: cuando se arma el prompt todavía no se sabe cuál va a atender, así
// que van las de todos los encendidos, cada una abajo de su agente.
export async function getContenidoPorAgente(tenantId, agentIds) {
  if (agentIds.length === 0) return {}

  const filas = await many(
    `SELECT ak.agent_id AS "agentId", a.key AS "agentKey", s.title, s.content
     FROM agent_knowledge ak
     JOIN knowledge_sources s ON s.tenant_id = ak.tenant_id AND s.id = ak.source_id
     JOIN agents a ON a.tenant_id = ak.tenant_id AND a.id = ak.agent_id
     WHERE ak.tenant_id = $1 AND ak.agent_id = ANY($2)
     ORDER BY s.created_at ASC`,
    [tenantId, agentIds],
  )

  const porAgente = {}
  let usados = 0
  for (const fila of filas) {
    const restante = MAX_CHARS_PROMPT - usados
    if (restante <= 0) break
    const content = fila.content.length > restante ? `${fila.content.slice(0, restante)}\n…` : fila.content
    usados += content.length
    ;(porAgente[fila.agentKey] ??= []).push({ title: fila.title, content })
  }
  return porAgente
}

export async function getSource(tenantId, id) {
  return one(`SELECT ${COLUMNAS} FROM knowledge_sources WHERE tenant_id = $1 AND id = $2`, [tenantId, id])
}

// Se crea desde la pantalla de un agente, así que se enciende para ese agente en
// el mismo paso: subir un documento y después tener que prenderlo es un segundo
// click para algo que nadie sube por las dudas.
export async function addSource(tenantId, { kind, title, origin, content, agentId = null }) {
  const now = new Date().toISOString()
  const id = `src-${crypto.randomUUID()}`

  await run(
    `INSERT INTO knowledge_sources (tenant_id, id, kind, title, origin, content, chars, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [tenantId, id, kind, title.slice(0, 120), origin ?? '', content, content.length, now],
  )

  if (agentId) await setAgentSource(tenantId, agentId, id, true)

  return getSource(tenantId, id)
}

export async function renameSource(tenantId, id, title) {
  const limpio = String(title ?? '').trim()
  if (!limpio) return null
  await run(
    'UPDATE knowledge_sources SET title = $1, updated_at = $2 WHERE tenant_id = $3 AND id = $4',
    [limpio.slice(0, 120), new Date().toISOString(), tenantId, id],
  )
  return getSource(tenantId, id)
}

// Borra la fuente para todo el negocio, no para un agente. El ON DELETE CASCADE
// del FK se lleva los interruptores de los agentes que la tenían encendida.
export async function deleteSource(tenantId, id) {
  return (await run('DELETE FROM knowledge_sources WHERE tenant_id = $1 AND id = $2', [tenantId, id])) > 0
}

// Encender es insertar la fila; apagar es borrarla. Que el agente y la fuente
// existan lo revisa la ruta, que es la que puede contestar un 404; acá el
// ON CONFLICT está por otra cosa: dos clicks seguidos en el mismo interruptor
// —o el mismo click desde dos pestañas— no pueden terminar en un 500.
export async function setAgentSource(tenantId, agentId, sourceId, enabled) {
  if (enabled) {
    await run(
      `INSERT INTO agent_knowledge (tenant_id, agent_id, source_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [tenantId, agentId, sourceId, new Date().toISOString()],
    )
    return
  }

  await run('DELETE FROM agent_knowledge WHERE tenant_id = $1 AND agent_id = $2 AND source_id = $3', [
    tenantId,
    agentId,
    sourceId,
  ])
}

// Cuántos agentes usan cada fuente. La pantalla lo dice al borrar: una fuente
// que están mirando tres agentes no se borra igual que una que no usa ninguno.
export async function getUsoPorFuente(tenantId) {
  const filas = await many(
    'SELECT source_id AS id, COUNT(*)::int AS n FROM agent_knowledge WHERE tenant_id = $1 GROUP BY source_id',
    [tenantId],
  )
  return Object.fromEntries(filas.map((f) => [f.id, f.n]))
}
