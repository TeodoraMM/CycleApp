import { requireAdmin } from '../../../../../utils/auth'
import {
  findAdminUser,
  findDiaryEntry,
  recordAudit,
  updateDiaryForUser,
} from '../../../../../utils/adminStore'
import { normalizeDiaryInput, positiveId } from '../../../../../utils/adminValidation'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const userId = positiveId(getRouterParam(event, 'id'))
  const entryId = positiveId(getRouterParam(event, 'entryId'))

  if (!findAdminUser(userId)) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }
  if (!findDiaryEntry(userId, entryId)) {
    throw createError({ statusCode: 404, statusMessage: 'Diary entry not found.' })
  }

  const input = normalizeDiaryInput(await readBody(event))
  const entry = updateDiaryForUser(userId, entryId, input)
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Diary entry not found.' })

  recordAudit(admin.id, 'diary.update', 'diary_entry', String(entryId), { userId, date: entry.date })
  return { entry }
})
