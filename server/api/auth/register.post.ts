import { createUser, findUserByEmail } from '../../utils/db'
import { hashPassword, setAuthCookie, toAuthUser } from '../../utils/auth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown; password?: unknown }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long.',
    })
  }

  if (password.length > 72) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be 72 characters or fewer.',
    })
  }

  if (findUserByEmail(email)) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use.' })
  }

  let row
  try {
    row = createUser(email, hashPassword(password))
  } catch (error) {
    console.error('[auth] register failed:', error)
    throw createError({ statusCode: 409, statusMessage: 'Email already in use.' })
  }

  const user = toAuthUser(row)
  setAuthCookie(event, user)
  return { user }
})
