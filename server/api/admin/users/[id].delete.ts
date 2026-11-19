import { requireAdmin } from '../../../utils/auth'
import {
  countAdministrators,
  deleteUserAccount,
  findAdminUser,
  recordAudit,
} from '../../../utils/adminStore'
import { positiveId } from '../../../utils/adminValidation'

export default defineEventHandler((event) => {
  const admin = requireAdmin(event)
  const id = positiveId(getRouterParam(event, 'id'))
  const user = findAdminUser(id)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  if (admin.id === id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own account.' })
  }
  if (user.isAdmin && countAdministrators() <= 1) {
    throw createError({ statusCode: 400, statusMessage: 'The last administrator cannot be deleted.' })
  }

  recordAudit(admin.id, 'user.delete', 'user', String(id), {
    email: user.email,
  })
  deleteUserAccount(id)

  return { ok: true }
})
