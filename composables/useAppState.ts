import type {
  AppState,
  CustomFoodInput,
  CycleSettings,
  DailyLog,
  FoodEntry,
  MealType,
  UserProfile,
} from '~/types'
import type { PeriodLogResult } from '~/utils/cycle'
import {
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  logPeriodStart,
  normalizeCycleLength,
  normalizePeriodLength,
} from '~/utils/cycle'
import { normalizeGoal } from '~/data/goals'

export function createDefaultState(): AppState {
  return {
    version: 2,
    profile: {
      name: '',
      age: 30,
      heightCm: 165,
      weightKg: 65,
      activityLevel: 'moderate',
      goal: 'energy',
      dietPreference: 'balanced',
      calorieMode: 'recommended',
      customCalories: 2000,
      customProtein: 0,
      customCarbs: 0,
      customFat: 0,
    },
    cycle: {
      entries: [],
      cycleLength: DEFAULT_CYCLE_LENGTH,
      periodLength: DEFAULT_PERIOD_LENGTH,
      predictionsEnabled: true,
    },
    foods: [],
    logs: {},
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useAppState() {
  const state = useState<AppState>('cyclefuel', createDefaultState)

  function getLog(date: string): DailyLog | undefined {
    return state.value.logs[date]
  }

  function ensureLog(date: string): DailyLog {
    const existing = state.value.logs[date]
    if (existing) return existing
    const log: DailyLog = { waterMl: 0 }
    state.value.logs[date] = log
    return log
  }

  function addFood(input: Omit<FoodEntry, 'id'>): void {
    state.value.foods.push({ ...input, id: createId() })
  }

  function addPresetFood(
    preset: Omit<FoodEntry, 'id' | 'date' | 'meal'>,
    date: string,
    meal: MealType,
  ): void {
    addFood({ ...preset, date, meal })
  }

  function addCustomFood(input: CustomFoodInput, date: string, meal: MealType): void {
    addFood({ ...input, date, meal })
  }

  function removeFood(id: string): void {
    state.value.foods = state.value.foods.filter((entry) => entry.id !== id)
  }

  function addWater(date: string, amount: number): void {
    const log = ensureLog(date)
    log.waterMl = Math.max(0, log.waterMl + amount)
  }

  function setWater(date: string, amount: number): void {
    const log = ensureLog(date)
    log.waterMl = Math.max(0, amount)
  }

  function updateProfile(patch: Partial<UserProfile>): void {
    const next = { ...patch }
    if (next.goal !== undefined) next.goal = normalizeGoal(next.goal)
    state.value.profile = { ...state.value.profile, ...next }
  }

  function updateCycle(
    patch: Partial<Pick<CycleSettings, 'cycleLength' | 'periodLength' | 'predictionsEnabled'>>,
  ): void {
    state.value.cycle = {
      ...state.value.cycle,
      ...(patch.cycleLength !== undefined
        ? { cycleLength: normalizeCycleLength(patch.cycleLength) }
        : {}),
      ...(patch.periodLength !== undefined
        ? { periodLength: normalizePeriodLength(patch.periodLength) }
        : {}),
      ...(patch.predictionsEnabled !== undefined
        ? { predictionsEnabled: Boolean(patch.predictionsEnabled) }
        : {}),
    }
  }

  function logPeriod(date: string): PeriodLogResult {
    const result = logPeriodStart(state.value.cycle.entries, date, state.value.cycle.periodLength)
    if (result.status !== 'rejected') {
      state.value.cycle = { ...state.value.cycle, entries: result.entries }
    }
    return result
  }

  function resetAll(): void {
    state.value = createDefaultState()
  }

  return {
    state,
    getLog,
    ensureLog,
    addFood,
    addPresetFood,
    addCustomFood,
    removeFood,
    addWater,
    setWater,
    updateProfile,
    updateCycle,
    logPeriod,
    resetAll,
  }
}
