import type { CycleEntry } from '~/types'
import { addDaysToKey, daysBetween, isDateKey, parseDateKey, todayKey } from '~/utils/date'

export const MIN_CYCLE_GAP_DAYS = 18
export const DEFAULT_CYCLE_LENGTH = 28
export const DEFAULT_PERIOD_LENGTH = 5

const MIN_CYCLE_LENGTH = 21
const MAX_CYCLE_LENGTH = 45
const MIN_PERIOD_LENGTH = 2
const MAX_PERIOD_LENGTH = 10

export interface PeriodLogResult {
  entries: CycleEntry[]
  status: 'added' | 'removed' | 'rejected'
  message: string
}

export interface CycleHistoryRow {
  start: string
  end: string
  duration: number
  cycleLength: number | null
}

function clampValue(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

export function normalizeCycleLength(value: unknown): number {
  return clampValue(value, MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH, DEFAULT_CYCLE_LENGTH)
}

export function normalizePeriodLength(value: unknown): number {
  return clampValue(value, MIN_PERIOD_LENGTH, MAX_PERIOD_LENGTH, DEFAULT_PERIOD_LENGTH)
}

export function normalizeCycleEntries(value: unknown, defaultDuration = DEFAULT_PERIOD_LENGTH): CycleEntry[] {
  if (!Array.isArray(value)) return []
  const cleaned: CycleEntry[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const rawStart = typeof item === 'string' ? item : (item as { start?: unknown } | null)?.start
    const rawDuration = typeof item === 'object' && item !== null ? (item as { duration?: unknown }).duration : undefined
    if (typeof rawStart !== 'string' || !isDateKey(rawStart) || seen.has(rawStart)) continue
    seen.add(rawStart)
    cleaned.push({
      start: rawStart,
      duration: normalizePeriodLength(rawDuration ?? defaultDuration),
    })
  }

  cleaned.sort((a, b) => a.start.localeCompare(b.start))

  const kept: CycleEntry[] = []
  for (const entry of cleaned) {
    const previous = kept[kept.length - 1]
    if (
      previous &&
      daysBetween(parseDateKey(previous.start), parseDateKey(entry.start)) < MIN_CYCLE_GAP_DAYS
    ) {
      continue
    }
    kept.push(entry)
  }
  return kept
}

export function isPeriodStartDate(entries: CycleEntry[], date: string): boolean {
  return entries.some((entry) => entry.start === date)
}

export function isLoggedPeriodDay(entries: CycleEntry[], date: string): boolean {
  if (!isDateKey(date)) return false
  return entries.some((entry) => date >= entry.start && date <= addDaysToKey(entry.start, entry.duration - 1))
}

export function logPeriodStart(
  entries: CycleEntry[],
  date: string,
  duration: number,
  today = todayKey(),
): PeriodLogResult {
  const clean = normalizeCycleEntries(entries, duration)

  if (!isDateKey(date)) {
    return { entries: clean, status: 'rejected', message: 'Choose a valid date.' }
  }
  if (date > today) {
    return { entries: clean, status: 'rejected', message: 'You can only log a period on or before today.' }
  }
  if (isPeriodStartDate(clean, date)) {
    return {
      entries: clean.filter((entry) => entry.start !== date),
      status: 'removed',
      message: 'Period start removed.',
    }
  }

  const target = parseDateKey(date)
  const nearby = clean.find(
    (entry) => Math.abs(daysBetween(parseDateKey(entry.start), target)) < MIN_CYCLE_GAP_DAYS,
  )
  if (nearby) {
    const gap = Math.abs(daysBetween(parseDateKey(nearby.start), target))
    return {
      entries: clean,
      status: 'rejected',
      message: `A period was already logged ${gap} ${gap === 1 ? 'day' : 'days'} from this date. Starts must be at least ${MIN_CYCLE_GAP_DAYS} days apart.`,
    }
  }

  return {
    entries: [...clean, { start: date, duration: normalizePeriodLength(duration) }],
    status: 'added',
    message: 'Period start saved.',
  }
}

export function buildCycleHistory(entries: CycleEntry[]): CycleHistoryRow[] {
  const sorted = normalizeCycleEntries(entries)
  const rows: CycleHistoryRow[] = []

  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index]!
    const previous = sorted[index - 1]
    rows.unshift({
      start: entry.start,
      end: addDaysToKey(entry.start, entry.duration - 1),
      duration: entry.duration,
      cycleLength: previous ? daysBetween(parseDateKey(previous.start), parseDateKey(entry.start)) : null,
    })
  }
  return rows
}
