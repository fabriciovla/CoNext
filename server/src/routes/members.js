import { Router } from 'express'
import { ah } from '../middleware/asyncHandler.js'
import {
  listMembers,
  listInvites,
  addMember,
  updateMemberRole,
  removeMember,
  removeInvite,
} from '../services/membersService.js'

const router = Router()

router.get(
  '/',
  ah(async (req, res) => {
    const [members, invites] = await Promise.all([
      listMembers(req.tenantId),
      listInvites(req.tenantId),
    ])
    res.json({ members, invites })
  }),
)

router.post(
  '/',
  ah(async (req, res) => {
    const result = await addMember(req.tenantId, {
      email: req.body.email,
      role: req.body.role,
      userId: req.body.userId,
    })
    if (result.error === 'email-invalido' || result.error === 'rol-invalido') {
      return res.status(400).json(result)
    }
    if (result.error === 'usuario-inexistente') {
      return res.status(404).json(result)
    }
    if (result.error === 'ya-es-miembro') {
      return res.status(409).json(result)
    }
    res.status(201).json(result)
  }),
)

router.patch(
  '/:userId',
  ah(async (req, res) => {
    const result = await updateMemberRole(req.tenantId, req.params.userId, req.body.role)
    if (result.error === 'rol-invalido') return res.status(400).json(result)
    if (result.error === 'not-found') return res.status(404).json(result)
    if (result.error === 'ultimo-owner') return res.status(409).json(result)
    res.json(result)
  }),
)

router.delete(
  '/invites/:email',
  ah(async (req, res) => {
    res.json(await removeInvite(req.tenantId, decodeURIComponent(req.params.email)))
  }),
)

router.delete(
  '/:userId',
  ah(async (req, res) => {
    const result = await removeMember(req.tenantId, req.params.userId)
    if (result.reason === 'not-found') return res.status(404).json(result)
    if (result.reason === 'ultimo-owner') return res.status(409).json(result)
    res.json(result)
  }),
)

export default router
