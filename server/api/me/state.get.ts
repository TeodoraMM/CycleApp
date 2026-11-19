import { requireAuth } from '../../utils/auth'
import { getStoredUserState } from '../../utils/adminStore'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  return { state: getStoredUserState(user.id) }
})
