import type { CycleSettings, UserProfile } from '~/types'
import { DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH } from '~/utils/cycle'

export const LOCAL_STATE_KEY = 'cyclefuel:v1'
export const LOCAL_SYNC_KEY = 'cyclefuel:sync:v1'

export function localStateKey(userId: number): string {
  return `${LOCAL_STATE_KEY}:${userId}`
}

export function localSyncKey(userId: number): string {
  return `${LOCAL_SYNC_KEY}:${userId}`
}

export function clearLocalUserData(userId?: number | null): void {
  if (typeof window === 'undefined') return
  const keys = [LOCAL_STATE_KEY, LOCAL_SYNC_KEY]
  if (userId) keys.push(localStateKey(userId), localSyncKey(userId))
  for (const key of keys) window.localStorage.removeItem(key)
}

export function isProfileConfigured(profile: UserProfile): boolean {
  return profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0
}

export function hasNutritionData(profile: UserProfile): boolean {
  return isProfileConfigured(profile) || (profile.calorieMode === 'custom' && profile.customCalories > 0)
}

export function toStoredProfile(profile: UserProfile): UserProfile | null {
  if (!hasNutritionData(profile) && !profile.name.trim()) return null
  return {
    ...profile,
    age: Math.round(profile.age),
    heightCm: Math.round(profile.heightCm),
    weightKg: Math.round(profile.weightKg),
    customCalories: Math.round(profile.customCalories),
    customProtein: Math.round(profile.customProtein),
    customCarbs: Math.round(profile.customCarbs),
    customFat: Math.round(profile.customFat),
  }
}

export function toStoredCycle(cycle: CycleSettings): CycleSettings | null {
  const hasSettings =
    cycle.cycleLength !== DEFAULT_CYCLE_LENGTH ||
    cycle.periodLength !== DEFAULT_PERIOD_LENGTH ||
    !cycle.predictionsEnabled
  if (cycle.entries.length === 0 && !hasSettings) return null
  return cycle
}
