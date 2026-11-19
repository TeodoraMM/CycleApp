import type {
  AccountStatus,
  AdminAuditEntry,
  AdminUserDetail,
  AdminUserSummary,
  CycleSettings,
  DailyLog,
  FoodEntry,
  MealType,
  QuestionnaireRecord,
  StoredUserState,
  SupplementRecord,
  UserProfile,
} from '~/types'
import {
  createDiaryEntry,
  db,
  findUserById,
  listDiaryEntries,
  removeDiaryEntry,
  type UserRow,
} from './db'

interface JoinedUserRow extends UserRow {
  profile_json: string | null
  cycle_json: string | null
  logs_json: string | null
  supplements_json: string | null
  questionnaire_json: string | null
  state_updated_at: string | null
}

interface AuditRow {
  id: number
  admin_id: number | null
  admin_email: string | null
  action: string
  target_type: string
  target_id: string | null
  details: string
  created_at: string
}

const USER_SELECT = `
  SELECT u.*,
    s.profile_json, s.cycle_json, s.logs_json,
    s.supplements_json, s.questionnaire_json,
    s.updated_at AS state_updated_at
  FROM users u
  LEFT JOIN user_states s ON s.user_id = u.id
`

const selectJoinedUsers = db.prepare(`${USER_SELECT} ORDER BY u.id ASC`)
const selectJoinedUser = db.prepare(`${USER_SELECT} WHERE u.id = ? LIMIT 1`)
const selectDiaryRow = db.prepare('SELECT * FROM diary_entries WHERE id = ? AND user_id = ? LIMIT 1')
const updateDiaryStatement = db.prepare(`
  UPDATE diary_entries
  SET date = ?, meal = ?, name = ?, serving = ?, calories = ?, protein = ?, carbs = ?, fat = ?
  WHERE id = ? AND user_id = ?
`)
const updateAccountStatement = db.prepare(
  "UPDATE users SET account_status = ?, is_admin = ? WHERE id = ?",
)
const updateEmailStatement = db.prepare('UPDATE users SET email = ? WHERE id = ?')
const deleteUserStatement = db.prepare('DELETE FROM users WHERE id = ?')
const countAdminsStatement = db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_admin = 1')
const insertAuditStatement = db.prepare(`
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (?, ?, ?, ?, ?)
`)
const selectAudit = db.prepare(`
  SELECT a.*, u.email AS admin_email
  FROM admin_audit_log a
  LEFT JOIN users u ON u.id = a.admin_id
  ORDER BY a.id DESC
  LIMIT ? OFFSET ?
`)
const countAuditStatement = db.prepare('SELECT COUNT(*) AS count FROM admin_audit_log')

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function mapSummary(row: JoinedUserRow): AdminUserSummary {
  const profile = parseJson<UserProfile | null>(row.profile_json, null)
  const { firstName, lastName } = splitName(profile?.name ?? '')

  return {
    id: row.id,
    firstName,
    lastName,
    email: row.email,
    createdAt: row.created_at,
    status: row.account_status,
    goal: profile?.goal ?? null,
    lastActivityAt: row.last_seen_at,
    isAdmin: Boolean(row.is_admin),
    hasProfile: Boolean(profile),
  }
}

export function getStoredUserState(userId: number): StoredUserState {
  const row = selectJoinedUser.get(userId) as JoinedUserRow | undefined
  if (!row) {
    return { profile: null, cycle: null, logs: {}, supplements: [], questionnaire: [], updatedAt: null }
  }

  return {
    profile: parseJson<UserProfile | null>(row.profile_json, null),
    cycle: parseJson<CycleSettings | null>(row.cycle_json, null),
    logs: parseJson<Record<string, DailyLog>>(row.logs_json, {}),
    supplements: parseJson<SupplementRecord[]>(row.supplements_json, []),
    questionnaire: parseJson<QuestionnaireRecord[]>(row.questionnaire_json, []),
    updatedAt: row.state_updated_at,
  }
}

export function listAdminUsers(): AdminUserSummary[] {
  return (selectJoinedUsers.all() as unknown as JoinedUserRow[]).map(mapSummary)
}

export function findAdminUser(id: number): AdminUserSummary | null {
  const row = selectJoinedUser.get(id) as JoinedUserRow | undefined
  return row ? mapSummary(row) : null
}

export function getAdminUserDetail(id: number): AdminUserDetail | null {
  const summary = findAdminUser(id)
  if (!summary) return null
  return {
    ...summary,
    state: getStoredUserState(id),
    entries: listDiaryEntries(id),
  }
}

export function countAdministrators(): number {
  const row = countAdminsStatement.get() as { count: number }
  return Number(row.count)
}

export function updateAccount(
  id: number,
  patch: { status?: AccountStatus; isAdmin?: boolean },
): boolean {
  const current = findUserById(id)
  if (!current) return false

  updateAccountStatement.run(
    patch.status ?? current.account_status,
    patch.isAdmin === undefined ? current.is_admin : patch.isAdmin ? 1 : 0,
    id,
  )
  return true
}

export function updateUserEmail(id: number, email: string): boolean {
  return Number(updateEmailStatement.run(email, id).changes) > 0
}

export function deleteUserAccount(id: number): boolean {
  return Number(deleteUserStatement.run(id).changes) > 0
}

export function saveUserState(
  userId: number,
  patch: Partial<Omit<StoredUserState, 'updatedAt'>>,
): StoredUserState {
  const current = getStoredUserState(userId)
  const next: StoredUserState = {
    profile: patch.profile === undefined ? current.profile : patch.profile,
    cycle: patch.cycle === undefined ? current.cycle : patch.cycle,
    logs: patch.logs === undefined ? current.logs : patch.logs,
    supplements: patch.supplements === undefined ? current.supplements : patch.supplements,
    questionnaire: patch.questionnaire === undefined ? current.questionnaire : patch.questionnaire,
    updatedAt: null,
  }

  db.prepare(`
    INSERT INTO user_states (user_id, profile_json, cycle_json, logs_json, supplements_json, questionnaire_json)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      profile_json = excluded.profile_json,
      cycle_json = excluded.cycle_json,
      logs_json = excluded.logs_json,
      supplements_json = excluded.supplements_json,
      questionnaire_json = excluded.questionnaire_json,
      updated_at = datetime('now')
  `).run(
    userId,
    JSON.stringify(next.profile),
    JSON.stringify(next.cycle),
    JSON.stringify(next.logs),
    JSON.stringify(next.supplements),
    JSON.stringify(next.questionnaire),
  )

  return getStoredUserState(userId)
}

export function createDiaryForUser(userId: number, input: Omit<FoodEntry, 'id'>): FoodEntry {
  return createDiaryEntry(userId, input)
}

export function updateDiaryForUser(
  userId: number,
  entryId: number,
  input: Omit<FoodEntry, 'id'>,
): FoodEntry | null {
  const result = updateDiaryStatement.run(
    input.date,
    input.meal,
    input.name,
    input.serving,
    input.calories,
    input.protein,
    input.carbs,
    input.fat,
    entryId,
    userId,
  )
  if (!Number(result.changes)) return null
  return listDiaryEntries(userId).find((entry) => Number(entry.id) === entryId) ?? null
}

export function deleteDiaryForUser(userId: number, entryId: number): boolean {
  return removeDiaryEntry(userId, entryId)
}

export function findDiaryEntry(userId: number, entryId: number): FoodEntry | null {
  const row = selectDiaryRow.get(entryId, userId) as
    | {
        id: number
        date: string
        meal: string
        name: string
        serving: string
        calories: number
        protein: number
        carbs: number
        fat: number
      }
    | undefined
  if (!row) return null
  return {
    id: String(row.id),
    date: row.date,
    meal: row.meal as MealType,
    name: row.name,
    serving: row.serving,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
  }
}

export function recordAudit(
  adminId: number,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>,
): void {
  insertAuditStatement.run(adminId, action, targetType, targetId, JSON.stringify(details))
}

export function listAudit(limit: number, offset: number): { entries: AdminAuditEntry[]; total: number } {
  const rows = selectAudit.all(limit, offset) as unknown as AuditRow[]
  const totalRow = countAuditStatement.get() as { count: number }
  return {
    entries: rows.map((row) => ({
      id: row.id,
      adminId: row.admin_id ?? 0,
      adminEmail: row.admin_email ?? 'Deleted administrator',
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      details: row.details,
      createdAt: row.created_at,
    })),
    total: Number(totalRow.count),
  }
}
