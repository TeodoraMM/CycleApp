import { getAuthUser } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { user }
})
