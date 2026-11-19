import { requireAdmin } from '../../../utils/auth'
import { listAdminUsers } from '../../../utils/adminStore'
import type { AdminUserListResponse, AdminUserSummary, Goal } from '~/types'

const SORT_FIELDS = ['id', 'email', 'createdAt', 'lastActivityAt', 'goal'] as const
type SortField = (typeof SORT_FIELDS)[number]

function queryValue(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

export default defineEventHandler((event) => {
  requireAdmin(event)

  const query = getQuery(event)
  const search = queryValue(query.q).trim().toLowerCase()
  const goal = queryValue(query.goal) as Goal | ''
  const status = queryValue(query.status)
  const from = queryValue(query.from)
  const to = queryValue(query.to)
  const sortRaw = queryValue(query.sort)
  const sort: SortField = SORT_FIELDS.includes(sortRaw as SortField) ? (sortRaw as SortField) : 'createdAt'
  const direction = queryValue(query.dir) === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, Number(queryValue(query.page)) || 1)
  const pageSize = Math.min(100, Math.max(5, Number(queryValue(query.pageSize)) || 10))

  let users: AdminUserSummary[] = listAdminUsers()

  if (search) {
    users = users.filter((user) =>
      [user.email, user.firstName, user.lastName, String(user.id)]
        .join(' ')
        .toLowerCase()
        .includes(search),
    )
  }
  if (goal) users = users.filter((user) => user.goal === goal)
  if (status === 'active' || status === 'disabled') {
    users = users.filter((user) => user.status === status)
  }
  if (from) users = users.filter((user) => user.createdAt.slice(0, 10) >= from)
  if (to) users = users.filter((user) => user.createdAt.slice(0, 10) <= to)

  users.sort((a, b) => {
    const left = a[sort] ?? ''
    const right = b[sort] ?? ''
    const comparison = String(left).localeCompare(String(right), undefined, { numeric: true })
    return direction === 'asc' ? comparison : -comparison
  })

  const total = users.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = users.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    users: paginated,
    total,
    page: safePage,
    pageSize,
    totalPages,
  } satisfies AdminUserListResponse
})
