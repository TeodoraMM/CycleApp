import { requireAdmin } from '../../utils/auth'
import { db } from '../../utils/db'
import { listAdminUsers } from '../../utils/adminStore'
import { GOAL_LIST, GOAL_META } from '~/data/goals'
import type { AdminOverview } from '~/types'

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function lastDays(count: number): string[] {
  const today = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() - (count - 1 - index))
    return dayKey(date)
  })
}

export default defineEventHandler((event): AdminOverview => {
  requireAdmin(event)

  const users = listAdminUsers()
  const entries = db
    .prepare('SELECT created_at, date FROM diary_entries')
    .all() as Array<{ created_at: string; date: string }>
  const profileCountRow = db
    .prepare("SELECT COUNT(*) AS count FROM user_states WHERE profile_json NOT IN ('', 'null')")
    .get() as { count: number }

  const days = lastDays(7)
  const registrationTrend = days.map((day) => ({
    label: day.slice(5),
    value: users.filter((user) => user.createdAt.slice(0, 10) === day).length,
  }))
  const entryTrend = days.map((day) => ({
    label: day.slice(5),
    value: entries.filter((entry) => entry.created_at.slice(0, 10) === day).length,
  }))

  const sevenDayCutoff = dayKey(new Date(Date.now() - 7 * 86_400_000))
  const thirtyDayCutoff = dayKey(new Date(Date.now() - 30 * 86_400_000))

  return {
    totals: {
      users: users.length,
      newUsers: users.filter((user) => user.createdAt.slice(0, 10) >= sevenDayCutoff).length,
      activeUsers: users.filter((user) => (user.lastActivityAt?.slice(0, 10) ?? '') >= thirtyDayCutoff)
        .length,
      foodEntries: entries.length,
      profiles: Number(profileCountRow.count),
    },
    goalBreakdown: GOAL_LIST.map((goal) => ({
      goal,
      label: GOAL_META[goal].label,
      count: users.filter((user) => user.goal === goal).length,
    })),
    registrationTrend,
    entryTrend,
    recentUsers: [...users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
  }
})
