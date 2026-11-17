const DAY_MS = 86_400_000

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function isDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  return toDateKey(parseDateKey(key)) === key
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

export function addDaysToKey(key: string, amount: number): string {
  return toDateKey(addDays(parseDateKey(key), amount))
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b - a) / DAY_MS)
}

export function formatLong(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseDateKey(key))
}

export function formatMedium(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(key))
}

export function formatShort(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(key))
}

export function formatMonthLabel(key: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(parseDateKey(key))
}

export function weekdayShort(key: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(parseDateKey(key))
}

export function monthStart(key: string): string {
  const date = parseDateKey(key)
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function shiftMonth(key: string, amount: number): string {
  const date = parseDateKey(key)
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1))
}

export function isToday(key: string): boolean {
  return key === todayKey()
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value)
}
