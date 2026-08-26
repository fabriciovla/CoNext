import crypto from 'node:crypto'
import { one, many, run } from '../db/index.js'

const ROLES = new Set(['owner', 'admin', 'operador'])

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

function mapMember(row) {
  return {
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    email: row.email,
    displayName: row.display_name,
  }
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function parseRole(role, fallback = 'operador') {
  const value = String(role ?? fallback).trim().toLowerCase()
  return ROLES.has(value) ? value : null
}

// Alta de perfil. Si el email ya existe, no crea otro: "Ana@x.com" y
// "ana@x.com" son la misma persona. Devuelve la fila, nueva o vieja.
export async function ensureUser({ id, email, displayName }) {
  const mail = normalizeEmail(email)
  if (!mail || !mail.includes('@')) return { error: 'email-invalido' }

  const existing = await one('SELECT * FROM users WHERE lower(email) = $1', [mail])
  if (existing) return { user: mapUser(existing), created: false }

  const userId = id ?? crypto.randomUUID()
  const nombre = String(displayName ?? '').trim() || mail.split('@')[0]
  const row = await one(
    `INSERT INTO users (id, email, display_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, mail, nombre],
  )
  return { user: mapUser(row), created: true }
}

export async function getUser(userId) {
  return mapUser(await one('SELECT * FROM users WHERE id = $1', [userId]))
}

export async function listMembers(tenantId) {
  return many(
    `SELECT m.user_id, m.role, m.created_at, u.email, u.display_name
     FROM tenant_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.tenant_id = $1
     ORDER BY m.created_at ASC`,
    [tenantId],
  ).then((rows) => rows.map(mapMember))
}

export async function listInvites(tenantId) {
  return many(
    `SELECT email, role, invited_by AS "invitedBy", created_at AS "createdAt"
     FROM tenant_invites
     WHERE tenant_id = $1
     ORDER BY created_at ASC`,
    [tenantId],
  )
}

// Los negocios a los que pertenece una persona. Es lo que va a listar el
// selector de cuenta cuando el login deje de ser una API key y pase a ser
// un usuario con sesión.
export async function listTenantsForUser(userId) {
  return many(
    `SELECT t.id, t.name, t.slug, t.status, m.role
     FROM tenant_members m
     JOIN tenants t ON t.id = m.tenant_id
     WHERE m.user_id = $1
     ORDER BY t.created_at ASC`,
    [userId],
  )
}

export async function getMembership(tenantId, userId) {
  return (
    (await one(
      `SELECT user_id AS "userId", role, created_at AS "createdAt"
       FROM tenant_members WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId],
    )) ?? null
  )
}

async function countOwners(clientOrNull, tenantId) {
  const sql = `SELECT COUNT(*)::int AS n FROM tenant_members WHERE tenant_id = $1 AND role = 'owner'`
  if (clientOrNull) {
    const { rows } = await clientOrNull.query(sql, [tenantId])
    return rows[0].n
  }
  const row = await one(sql, [tenantId])
  return row.n
}

// Suma una persona al cliente. Si ya tiene cuenta, entra ya. Si no, queda
// como invitación y el trigger de Auth la convierte en membresía al registrarse.
export async function addMember(tenantId, { email, role, invitedBy, userId }) {
  const parsedRole = parseRole(role)
  if (!parsedRole) return { error: 'rol-invalido' }

  if (userId) {
    const user = await getUser(userId)
    if (!user) return { error: 'usuario-inexistente' }
    const ya = await getMembership(tenantId, userId)
    if (ya) return { error: 'ya-es-miembro', member: ya }

    await run(
      `INSERT INTO tenant_members (tenant_id, user_id, role) VALUES ($1, $2, $3)`,
      [tenantId, userId, parsedRole],
    )
    return { member: { ...user, userId: user.id, role: parsedRole } }
  }

  const mail = normalizeEmail(email)
  if (!mail || !mail.includes('@')) return { error: 'email-invalido' }

  const existente = await one('SELECT * FROM users WHERE lower(email) = $1', [mail])
  if (existente) {
    const ya = await getMembership(tenantId, existente.id)
    if (ya) return { error: 'ya-es-miembro', member: ya }
    await run(
      `INSERT INTO tenant_members (tenant_id, user_id, role) VALUES ($1, $2, $3)`,
      [tenantId, existente.id, parsedRole],
    )
    await run('DELETE FROM tenant_invites WHERE tenant_id = $1 AND lower(email) = $2', [tenantId, mail])
    return { member: { ...mapUser(existente), userId: existente.id, role: parsedRole } }
  }

  await run(
    `INSERT INTO tenant_invites (tenant_id, email, role, invited_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, email) DO UPDATE
       SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by`,
    [tenantId, mail, parsedRole, invitedBy ?? null],
  )
  return { invite: { email: mail, role: parsedRole, invitedBy: invitedBy ?? null } }
}

export async function updateMemberRole(tenantId, userId, role) {
  const parsedRole = parseRole(role)
  if (!parsedRole) return { error: 'rol-invalido' }

  const actual = await getMembership(tenantId, userId)
  if (!actual) return { error: 'not-found' }

  if (actual.role === 'owner' && parsedRole !== 'owner') {
    const owners = await countOwners(null, tenantId)
    if (owners <= 1) return { error: 'ultimo-owner' }
  }

  const row = await one(
    `UPDATE tenant_members SET role = $1
     WHERE tenant_id = $2 AND user_id = $3
     RETURNING user_id AS "userId", role, created_at AS "createdAt"`,
    [parsedRole, tenantId, userId],
  )
  return { member: row }
}

export async function removeMember(tenantId, userId) {
  const actual = await getMembership(tenantId, userId)
  if (!actual) return { deleted: false, reason: 'not-found' }

  if (actual.role === 'owner') {
    const owners = await countOwners(null, tenantId)
    if (owners <= 1) return { deleted: false, reason: 'ultimo-owner' }
  }

  const n = await run('DELETE FROM tenant_members WHERE tenant_id = $1 AND user_id = $2', [
    tenantId,
    userId,
  ])
  return { deleted: n > 0 }
}

export async function removeInvite(tenantId, email) {
  const n = await run('DELETE FROM tenant_invites WHERE tenant_id = $1 AND lower(email) = $2', [
    tenantId,
    normalizeEmail(email),
  ])
  return { deleted: n > 0 }
}

// Lo llama provisionTenant cuando el alta ya sabe quién es el dueño (un
// registro con Auth). El CLI no lo usa: el tenant nace sin miembros y se
// atan después.
export async function addOwner(tenantId, userId) {
  await run(
    `INSERT INTO tenant_members (tenant_id, user_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner'`,
    [tenantId, userId],
  )
}
