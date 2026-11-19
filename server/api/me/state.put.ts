import { requireAuth } from '../../utils/auth'
import { getStoredUserState, saveUserState } from '../../utils/adminStore'
import { normalizeStatePatch } from '../../utils/adminValidation'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody<Record<string, unknown>>(event)
  const source = body?.state && typeof body.state === 'object' ? body.state : body
  const current = getStoredUserState(user.id)
  const patch = normalizeStatePatch(source, current)
  const state = Object.keys(patch).length ? saveUserState(user.id, patch) : current

  return { state }
})
