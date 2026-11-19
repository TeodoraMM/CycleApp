import { findUserByEmail } from '../../utils/db'
import { setAuthCookie, toAuthUser, verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown; password?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.',
    })
  }

  const row = findUserByEmail(email)
  if (!row || row.account_status === 'disabled' || !verifyPassword(password, row.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  const user = toAuthUser(row)
  setAuthCookie(event, user)
  return { user }
})
