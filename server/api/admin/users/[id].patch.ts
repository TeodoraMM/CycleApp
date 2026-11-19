import { findUserByEmail } from '../../../utils/db'
import { requireAdmin } from '../../../utils/auth'
import {
  countAdministrators,
  findAdminUser,
  getAdminUserDetail,
  getStoredUserState,
  recordAudit,
  saveUserState,
  updateAccount,
  updateUserEmail,
} from '../../../utils/adminStore'
import {
  normalizeEmail,
  normalizeStatePatch,
  normalizeStatus,
  positiveId,
} from '../../../utils/adminValidation'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const id = positiveId(getRouterParam(event, 'id'))
  const current = findAdminUser(id)

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  const changes: Record<string, unknown> = {}

  if ('email' in body) {
    const email = normalizeEmail(body.email)
    const existing = findUserByEmail(email)
    if (existing && existing.id !== id) {
      throw createError({ statusCode: 409, statusMessage: 'Email already in use.' })
    }
    if (updateUserEmail(id, email)) changes.email = email
  }

  if ('status' in body || 'isAdmin' in body) {
    const status = 'status' in body ? normalizeStatus(body.status) : current.status
    const isAdmin = 'isAdmin' in body ? body.isAdmin === true : current.isAdmin

    if (current.isAdmin && (!isAdmin || status === 'disabled') && countAdministrators() <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'The last administrator cannot be demoted or disabled.',
      })
    }

    updateAccount(id, { status, isAdmin })
    if (status !== current.status) changes.status = status
    if (isAdmin !== current.isAdmin) changes.isAdmin = isAdmin
  }

  if ('profile' in body || 'cycle' in body || 'logs' in body || 'supplements' in body || 'questionnaire' in body) {
    const patch = normalizeStatePatch(body, getStoredUserState(id))
    if (Object.keys(patch).length) {
      saveUserState(id, patch)
      for (const key of Object.keys(patch)) changes[key] = true
    }
  }

  if (!Object.keys(changes).length) {
    throw createError({ statusCode: 400, statusMessage: 'No valid changes provided.' })
  }

  recordAudit(admin.id, 'user.update', 'user', String(id), changes)
  const updated = getAdminUserDetail(id)
  return { user: updated }
})
