import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import type { AccountStatus, FoodEntry, MealType } from '~/types'

const require = createRequire(resolve(process.cwd(), 'package.json'))
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')

export interface UserRow {
  id: number
  email: string
  password_hash: string
  created_at: string
  is_admin: number
  account_status: AccountStatus
  last_seen_at: string | null
}

interface DiaryEntryRow {
  id: number
  user_id: number
  date: string
  meal: string
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

const databasePath =
  process.env.DATABASE_PATH || resolve(process.cwd(), '.data', 'cyclefuel.sqlite')

mkdirSync(dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_admin INTEGER NOT NULL DEFAULT 0,
    account_status TEXT NOT NULL DEFAULT 'active',
    last_seen_at TEXT
  );

  CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    meal TEXT NOT NULL,
    name TEXT NOT NULL,
    serving TEXT NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_states (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_json TEXT NOT NULL DEFAULT 'null',
    cycle_json TEXT NOT NULL DEFAULT 'null',
    logs_json TEXT NOT NULL DEFAULT '{}',
    supplements_json TEXT NOT NULL DEFAULT '[]',
    questionnaire_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date
    ON diary_entries (user_id, date);
  CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at
    ON admin_audit_log (created_at);
`)

function ensureColumn(table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

ensureColumn('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0')
ensureColumn('users', 'account_status', "TEXT NOT NULL DEFAULT 'active'")
ensureColumn('users', 'last_seen_at', 'TEXT')

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users (created_at);
  CREATE INDEX IF NOT EXISTS idx_users_last_seen_at
    ON users (last_seen_at);
`)

function syncAdminEmails(): void {
  const emails = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

  if (!emails.length) return

  const promote = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?')
  for (const email of emails) promote.run(email)
}

syncAdminEmails()

const insertUser = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
const insertEmptyUserState = db.prepare(`
  INSERT OR IGNORE INTO user_states
    (user_id, profile_json, cycle_json, logs_json, supplements_json, questionnaire_json)
  VALUES (?, 'null', 'null', '{}', '[]', '[]')
`)
const selectUserByEmail = db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1')
const selectUserById = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1')
const touchUserActivityStatement = db.prepare(
  "UPDATE users SET last_seen_at = datetime('now') WHERE id = ?",
)

const selectDiaryEntries = db.prepare(
  'SELECT * FROM diary_entries WHERE user_id = ? ORDER BY date DESC, id DESC',
)
const selectDiaryEntriesByDate = db.prepare(
  'SELECT * FROM diary_entries WHERE user_id = ? AND date = ? ORDER BY id ASC',
)
const selectDiaryEntry = db.prepare(
  'SELECT * FROM diary_entries WHERE id = ? AND user_id = ? LIMIT 1',
)
const insertDiaryEntry = db.prepare(`
  INSERT INTO diary_entries (user_id, date, meal, name, serving, calories, protein, carbs, fat)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const deleteDiaryEntry = db.prepare('DELETE FROM diary_entries WHERE id = ? AND user_id = ?')

function mapDiaryEntry(row: DiaryEntryRow): FoodEntry {
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

export function findUserByEmail(email: string): UserRow | null {
  const row = selectUserByEmail.get(email) as UserRow | undefined
  return row ?? null
}

export function findUserById(id: number): UserRow | null {
  const row = selectUserById.get(id) as UserRow | undefined
  return row ?? null
}

export function touchUserActivity(id: number): void {
  touchUserActivityStatement.run(id)
}

export function createUser(email: string, passwordHash: string): UserRow {
  const result = insertUser.run(email, passwordHash)
  const id = Number(result.lastInsertRowid)
  insertEmptyUserState.run(id)
  const row = findUserById(id)
  if (!row) throw new Error('Could not create user')
  return row
}

export function listDiaryEntries(userId: number, date?: string): FoodEntry[] {
  const rows = (
    date ? selectDiaryEntriesByDate.all(userId, date) : selectDiaryEntries.all(userId)
  ) as unknown as DiaryEntryRow[]
  return rows.map(mapDiaryEntry)
}

export function createDiaryEntry(
  userId: number,
  input: Omit<FoodEntry, 'id'>,
): FoodEntry {
  const result = insertDiaryEntry.run(
    userId,
    input.date,
    input.meal,
    input.name,
    input.serving,
    input.calories,
    input.protein,
    input.carbs,
    input.fat,
  )
  const row = selectDiaryEntry.get(Number(result.lastInsertRowid), userId) as
    | DiaryEntryRow
    | undefined
  if (!row) throw new Error('Could not create diary entry')
  return mapDiaryEntry(row)
}

export function removeDiaryEntry(userId: number, id: number): boolean {
  const result = deleteDiaryEntry.run(id, userId)
  return Number(result.changes) > 0
}
