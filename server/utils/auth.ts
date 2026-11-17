import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createError, deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import type { AuthUser } from '~/types'
import { findUserById, type UserRow } from './db'

const AUTH_COOKIE = 'cyclefuel_auth'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7
const DEV_SECRET = 'cyclefuel-local-development-secret-change-me'

function authSecret(event: H3Event): string {
  const secret = String(useRuntimeConfig(event).jwtSecret || '').trim()
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 500,
      statusMessage: 'JWT secret is not configured',
    })
  }
  return DEV_SECRET
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
  }
}

export function setAuthCookie(event: H3Event, user: AuthUser): void {
  const token = jwt.sign(
    { sub: String(user.id), email: user.email },
    authSecret(event),
    { expiresIn: TOKEN_TTL_SECONDS },
  )

  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  })
}

export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, AUTH_COOKIE, { path: '/' })
}

export function getAuthUser(event: H3Event): AuthUser | null {
  const token = getCookie(event, AUTH_COOKIE)
  if (!token) return null

  try {
    const payload = jwt.verify(token, authSecret(event))
    if (typeof payload === 'string' || !payload.sub) return null

    const row = findUserById(Number(payload.sub))
    return row ? toAuthUser(row) : null
  } catch {
    return null
  }
}

export function requireAuth(event: H3Event): AuthUser {
  const existing = event.context.user as AuthUser | undefined
  if (existing) return existing

  const user = getAuthUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  event.context.user = user
  return user
}
