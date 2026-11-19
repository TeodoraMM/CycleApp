import { createUser, findUserByEmail } from '../../../utils/db'
import { hashPassword, requireAdmin } from '../../../utils/auth'
import { findAdminUser, recordAudit } from '../../../utils/adminStore'
import { asString, normalizeEmail, normalizePassword } from '../../../utils/adminValidation'

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)
  const body = await readBody<Record<string, unknown>>(event)
  const email = normalizeEmail(body?.email)
  const password = normalizePassword(body?.password)
  const firstName = asString(body?.firstName, 60)
  const lastName = asString(body?.lastName, 60)

  if (findUserByEmail(email)) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use.' })
  }

  const row = createUser(email, hashPassword(password))
  const name = [firstName, lastName].filter(Boolean).join(' ')

  const created = findAdminUser(row.id)
  if (!created) throw createError({ statusCode: 500, statusMessage: 'Could not create user.' })

  recordAudit(admin.id, 'user.create', 'user', String(row.id), {
    email: created.email,
    name,
  })
  setResponseStatus(event, 201)
  return { user: created }
})
