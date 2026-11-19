import { requireAdmin } from '../../../../../utils/auth'
import {
  deleteDiaryForUser,
  findAdminUser,
  findDiaryEntry,
  recordAudit,
} from '../../../../../utils/adminStore'
import { positiveId } from '../../../../../utils/adminValidation'

export default defineEventHandler((event) => {
  const admin = requireAdmin(event)
  const userId = positiveId(getRouterParam(event, 'id'))
  const entryId = positiveId(getRouterParam(event, 'entryId'))

  if (!findAdminUser(userId)) {
    throw createError({ statusCode: 404, statusMessage: 'User not found.' })
  }

  const entry = findDiaryEntry(userId, entryId)
  if (!entry || !deleteDiaryForUser(userId, entryId)) {
    throw createError({ statusCode: 404, statusMessage: 'Diary entry not found.' })
  }

  recordAudit(admin.id, 'diary.delete', 'diary_entry', String(entryId), { userId, date: entry.date })
  return { ok: true }
})
