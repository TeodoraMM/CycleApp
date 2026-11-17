import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { FoodEntry, MealType } from '~/types'

export interface UserRow {
  id: number
  email: string
  password_hash: string
  created_at: string
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

const db = new DatabaseSync(databasePath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date
    ON diary_entries (user_id, date);
`)

const insertUser = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
const selectUserByEmail = db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1')
const selectUserById = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1')

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

export function createUser(email: string, passwordHash: string): UserRow {
  const result = insertUser.run(email, passwordHash)
  const row = findUserById(Number(result.lastInsertRowid))
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
