import { requireAdmin } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = requireAdmin(event)
  return { user }
})
