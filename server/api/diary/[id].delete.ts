import { removeDiaryEntry } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const rawId = getRouterParam(event, 'id')
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid diary entry.' })
  }

  if (!removeDiaryEntry(user.id, id)) {
    throw createError({ statusCode: 404, statusMessage: 'Diary entry not found.' })
  }

  return { ok: true }
})
