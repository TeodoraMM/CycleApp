import { createDefaultState, useAppState } from '~/composables/useAppState'
import type { AppState, CycleEntry, DailyLog, FoodEntry, UserProfile } from '~/types'
import { normalizeGoal } from '~/data/goals'
import { normalizeCycleEntries, normalizeCycleLength, normalizePeriodLength } from '~/utils/cycle'

const STORAGE_KEY = 'cyclefuel:v1'

interface StoredState {
  version?: number
  profile?: Partial<UserProfile>
  cycle?: {
    entries?: CycleEntry[]
    history?: string[]
    lastPeriodStart?: string
    cycleLength?: number
    periodLength?: number
    predictionsEnabled?: boolean
  }
  foods?: FoodEntry[]
  logs?: Record<string, { waterMl?: number }>
}

function mergeState(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) return null
    const defaults = createDefaultState()
    const logs: Record<string, DailyLog> = {}
    if (parsed.logs && typeof parsed.logs === 'object') {
      for (const [key, log] of Object.entries(parsed.logs)) {
        logs[key] = { waterMl: typeof log?.waterMl === 'number' ? log.waterMl : 0 }
      }
    }
    const profile = { ...defaults.profile, ...parsed.profile }
    profile.goal = normalizeGoal(profile.goal)

    const cycleLength = normalizeCycleLength(parsed.cycle?.cycleLength)
    const periodLength = normalizePeriodLength(parsed.cycle?.periodLength)
    const rawEntries: unknown = Array.isArray(parsed.cycle?.entries)
      ? parsed.cycle.entries
      : [
          ...(Array.isArray(parsed.cycle?.history) ? parsed.cycle.history : []),
          ...(parsed.cycle?.lastPeriodStart ? [parsed.cycle.lastPeriodStart] : []),
        ]

    return {
      version: 2,
      profile,
      cycle: {
        entries: normalizeCycleEntries(rawEntries, periodLength),
        cycleLength,
        periodLength,
        predictionsEnabled: parsed.cycle?.predictionsEnabled !== false,
      },
      foods: Array.isArray(parsed.foods) ? parsed.foods : [],
      logs,
    }
  } catch {
    return null
  }
}

export default defineNuxtPlugin(() => {
  const { state } = useAppState()

  onNuxtReady(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const restored = mergeState(raw)
        if (restored) state.value = { ...restored, foods: state.value.foods }
      }
    } catch {
      // Storage can be unavailable in private browsing; the app still works in memory.
    }

    watch(
      state,
      (value) => {
        try {
          const snapshot: AppState = { ...value, foods: [] }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
        } catch {
          // Ignore quota or privacy errors.
        }
      },
      { deep: true },
    )
  })
})
