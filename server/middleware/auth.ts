import { requireAuth } from '../utils/auth'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  if (pathname !== '/api/diary' && !pathname.startsWith('/api/diary/')) return
  requireAuth(event)
})
