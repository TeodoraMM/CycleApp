import { requireAdmin } from '../../../../utils/auth'
import { createDiaryForUser, findAdminUser, recordAudit } from '../../../../utils/adminStore'
import { normalizeDiaryInput, positiveId } from '../../../../utils/adminValidation'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const userId = positiveId(getRouterParam(event, 'id'))

  if (!findAdminUser(userId)) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  const input = normalizeDiaryInput(await readBody(event))
  const entry = createDiaryForUser(userId, input)
  recordAudit(admin.id, 'diary.create', 'diary_entry', entry.id, { userId, date: entry.date })

  setResponseStatus(event, 201)
  return { entry }
})
