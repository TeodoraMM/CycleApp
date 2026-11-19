import { createError, sendRedirect } from 'h3'
import { getAuthUser } from '../utils/auth'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    const user = getAuthUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    if (!user.isAdmin) {
      throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
    }
    return
  }

  if (pathname === '/admin-teodora' || pathname.startsWith('/admin-teodora/')) {
    const user = getAuthUser(event)
    if (!user) {
      return sendRedirect(event, '/login?redirect=%2Fadmin-teodora', 302)
    }
    if (!user.isAdmin) {
      return sendRedirect(event, '/', 302)
    }
  }
})
