import { createError } from 'h3'
import type {
  AccountStatus,
  ActivityLevel,
  CalorieTargetMode,
  CycleSettings,
  DietPreference,
  FoodEntry,
  MealType,
  QuestionnaireRecord,
  StoredUserState,
  SupplementRecord,
  UserProfile,
} from '~/types'
import { normalizeGoal } from '~/data/goals'
import {
  normalizeCycleEntries,
  normalizeCycleLength,
  normalizePeriodLength,
} from '~/utils/cycle'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'veryActive',
]
const DIET_PREFERENCES: DietPreference[] = ['balanced', 'vegetarian', 'vegan', 'pescatarian']
const CALORIE_MODES: CalorieTargetMode[] = ['recommended', 'custom']

function invalid(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

export function asString(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

export function normalizeEmail(value: unknown): string {
  const email = asString(value, 254).toLowerCase()
  if (!EMAIL_PATTERN.test(email)) invalid('Enter a valid email address.')
  return email
}

export function normalizePassword(value: unknown): string {
  const password = typeof value === 'string' ? value : ''
  if (password.length < 8 || password.length > 72) {
    invalid('Password must be between 8 and 72 characters.')
  }
  return password
}

export function normalizeStatus(value: unknown): AccountStatus {
  return value === 'disabled' ? 'disabled' : 'active'
}

const EMPTY_PROFILE: UserProfile = {
  name: '',
  age: 0,
  heightCm: 0,
  weightKg: 0,
  activityLevel: 'moderate',
  goal: 'energy',
  dietPreference: 'balanced',
  calorieMode: 'recommended',
  customCalories: 0,
  customProtein: 0,
  customCarbs: 0,
  customFat: 0,
}

export function normalizeProfile(value: unknown, base?: UserProfile | null): UserProfile | null {
  if (value === null || value === undefined) return null
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  if (!Object.keys(source).length) return base ?? null

  const fallback = base ?? EMPTY_PROFILE
  const name = asString(source.name ?? fallback.name, 120)
  const calorieMode = CALORIE_MODES.includes(source.calorieMode as CalorieTargetMode)
    ? (source.calorieMode as CalorieTargetMode)
    : fallback.calorieMode

  const age = source.age === undefined ? fallback.age : asNumber(source.age)
  const heightCm = source.heightCm === undefined ? fallback.heightCm : asNumber(source.heightCm)
  const weightKg = source.weightKg === undefined ? fallback.weightKg : asNumber(source.weightKg)
  const customCalories =
    source.customCalories === undefined ? fallback.customCalories : asNumber(source.customCalories)
  const customProtein =
    source.customProtein === undefined ? fallback.customProtein : asNumber(source.customProtein)
  const customCarbs =
    source.customCarbs === undefined ? fallback.customCarbs : asNumber(source.customCarbs)
  const customFat = source.customFat === undefined ? fallback.customFat : asNumber(source.customFat)

  const configured = age > 0 || heightCm > 0 || weightKg > 0
  const validAge = !Number.isFinite(age) || age === 0 || (age >= 16 && age <= 80)
  const validHeight =
    !Number.isFinite(heightCm) || heightCm === 0 || (heightCm >= 120 && heightCm <= 220)
  const validWeight =
    !Number.isFinite(weightKg) || weightKg === 0 || (weightKg >= 35 && weightKg <= 200)
  if (!validAge || !validHeight || !validWeight) {
    invalid('Enter a valid age, height, and weight.')
  }
  if (configured && (age < 16 || heightCm < 120 || weightKg < 35)) {
    invalid('Complete your profile details to save them.')
  }

  const validCalories =
    !Number.isFinite(customCalories) ||
    customCalories === 0 ||
    (customCalories >= 800 && customCalories <= 6000)
  if (!validCalories || (calorieMode === 'custom' && customCalories < 800)) {
    invalid('Calories must be between 800 and 6000.')
  }
  if (
    [customProtein, customCarbs, customFat].some(
      (entry) => !Number.isFinite(entry) || entry < 0 || entry > 1000,
    )
  ) {
    invalid('Macros must be between 0 and 1000.')
  }

  const hasNutrition = configured || (calorieMode === 'custom' && customCalories > 0)
  if (!hasNutrition && !name) return null

  const activityLevel = ACTIVITY_LEVELS.includes(source.activityLevel as ActivityLevel)
    ? (source.activityLevel as ActivityLevel)
    : fallback.activityLevel
  const dietPreference = DIET_PREFERENCES.includes(source.dietPreference as DietPreference)
    ? (source.dietPreference as DietPreference)
    : fallback.dietPreference

  return {
    name,
    age: Math.round(Number.isFinite(age) ? age : 0),
    heightCm: Math.round(Number.isFinite(heightCm) ? heightCm : 0),
    weightKg: Math.round(Number.isFinite(weightKg) ? weightKg : 0),
    activityLevel,
    goal: normalizeGoal(source.goal ?? fallback.goal),
    dietPreference,
    calorieMode,
    customCalories: Math.round(Number.isFinite(customCalories) ? customCalories : 0),
    customProtein: Math.round(Number.isFinite(customProtein) ? customProtein : 0),
    customCarbs: Math.round(Number.isFinite(customCarbs) ? customCarbs : 0),
    customFat: Math.round(Number.isFinite(customFat) ? customFat : 0),
  }
}

export function normalizeCycle(value: unknown, base?: CycleSettings | null): CycleSettings | null {
  if (value === null || value === undefined) return null
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const cycleLength = normalizeCycleLength(source.cycleLength ?? base?.cycleLength ?? 28)
  const periodLength = normalizePeriodLength(source.periodLength ?? base?.periodLength ?? 5)
  return {
    entries: normalizeCycleEntries(source.entries ?? base?.entries ?? [], periodLength),
    cycleLength,
    periodLength,
    predictionsEnabled:
      typeof source.predictionsEnabled === 'boolean'
        ? source.predictionsEnabled
        : (base?.predictionsEnabled ?? true),
  }
}

export function normalizeLogs(value: unknown): Record<string, { waterMl: number }> {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const logs: Record<string, { waterMl: number }> = {}
  for (const [date, raw] of Object.entries(source)) {
    if (!DATE_PATTERN.test(date)) continue
    const waterMl = asNumber((raw as { waterMl?: unknown } | null)?.waterMl)
    if (!Number.isFinite(waterMl) || waterMl < 0 || waterMl > 20000) continue
    logs[date] = { waterMl: Math.round(waterMl) }
  }
  return logs
}

export function normalizeSupplements(value: unknown): SupplementRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 200).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const raw = item as Record<string, unknown>
    const name = asString(raw.name, 120)
    if (!name) return []
    return [
      {
        id: asString(raw.id, 80) || `sup-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        dose: asString(raw.dose, 120),
        frequency: asString(raw.frequency, 120),
        notes: asString(raw.notes, 500),
      },
    ]
  })
}

export function normalizeQuestionnaire(value: unknown): QuestionnaireRecord[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 300).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const raw = item as Record<string, unknown>
    const question = asString(raw.question, 300)
    if (!question) return []
    return [
      {
        id: asString(raw.id, 80) || `q-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        question,
        answer: asString(raw.answer, 2000),
        createdAt: asString(raw.createdAt, 40) || new Date().toISOString(),
      },
    ]
  })
}

export function normalizeStatePatch(
  value: unknown,
  base: StoredUserState,
): Partial<Omit<StoredUserState, 'updatedAt'>> {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const patch: Partial<Omit<StoredUserState, 'updatedAt'>> = {}

  if ('profile' in source) patch.profile = normalizeProfile(source.profile, base.profile)
  if ('cycle' in source) patch.cycle = normalizeCycle(source.cycle, base.cycle)
  if ('logs' in source) patch.logs = normalizeLogs(source.logs)
  if ('supplements' in source) patch.supplements = normalizeSupplements(source.supplements)
  if ('questionnaire' in source) patch.questionnaire = normalizeQuestionnaire(source.questionnaire)

  return patch
}

export function normalizeDiaryInput(value: unknown): Omit<FoodEntry, 'id'> {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const date = asString(source.date, 10)
  const meal = asString(source.meal, 20)
  const name = asString(source.name, 120)
  const serving = asString(source.serving, 80)
  const calories = asNumber(source.calories)
  const protein = asNumber(source.protein)
  const carbs = asNumber(source.carbs)
  const fat = asNumber(source.fat)

  if (!DATE_PATTERN.test(date)) invalid('Enter a valid date.')
  if (!MEAL_TYPES.includes(meal as MealType)) invalid('Enter a valid meal type.')
  if (!name) invalid('Food name is required.')
  if (!serving) invalid('Serving is required.')
  if (!Number.isFinite(calories) || calories <= 0 || calories > 10000) invalid('Enter valid calories.')
  if (
    [protein, carbs, fat].some((value) => !Number.isFinite(value) || value < 0 || value > 1000)
  ) {
    invalid('Enter valid macros.')
  }

  return {
    date,
    meal: meal as MealType,
    name,
    serving,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  }
}

export function positiveId(value: unknown): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) invalid('Invalid record.')
  return id
}
