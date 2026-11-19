import { requireAdmin } from '../../../utils/auth'
import { getAdminUserDetail } from '../../../utils/adminStore'
import { positiveId } from '../../../utils/adminValidation'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const id = positiveId(getRouterParam(event, 'id'))
  const user = getAdminUserDetail(id)

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  return { user }
})
