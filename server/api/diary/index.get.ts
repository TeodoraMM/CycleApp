import { listDiaryEntries } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const rawDate = getQuery(event).date

  let date: string | undefined
  if (rawDate !== undefined) {
    if (typeof rawDate !== 'string' || !DATE_PATTERN.test(rawDate)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid diary date.' })
    }
    date = rawDate
  }

  return { entries: listDiaryEntries(user.id, date) }
})
