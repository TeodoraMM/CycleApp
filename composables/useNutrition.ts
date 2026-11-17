import type { ActivityLevel, FoodEntry, MacroTotals, Phase, UserProfile } from '~/types'
import { PHASE_META } from '~/data/phases'
import { GOAL_META } from '~/data/goals'

export interface NutritionTargets {
  bmr: number
  tdee: number
  target: number
  recommendedTarget: number
  phaseAdjustment: number
  goalAdjustment: number
  macros: { protein: number; carbs: number; fat: number }
  split: { protein: number; carbs: number; fat: number }
  waterTarget: number
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

export function calculateTargets(profile: UserProfile, phase: Phase | null): NutritionTargets {
  const weight = Math.max(35, profile.weightKg || 65)
  const height = Math.max(120, profile.heightCm || 165)
  const age = Math.min(80, Math.max(16, profile.age || 30))
  const factor = ACTIVITY_FACTORS[profile.activityLevel] ?? ACTIVITY_FACTORS.moderate

  const bmr = 10 * weight + 6.25 * height - 5 * age - 161
  const tdee = bmr * factor
  const phaseSplit = PHASE_META[phase ?? 'follicular'].macroSplit
  const phaseAdjustment = phase ? PHASE_META[phase].calorieAdjustment : 0
  const goalAdjustment = GOAL_META[profile.goal]?.calorieAdjustment ?? 0
  const recommendedTarget =
    Math.round(Math.max(bmr * 1.1, tdee + phaseAdjustment + goalAdjustment) / 10) * 10
  const customTarget = Math.round(Math.min(6000, Math.max(800, profile.customCalories || 0)))
  const target =
    profile.calorieMode === 'custom' && profile.customCalories > 0
      ? customTarget
      : recommendedTarget

  const hasCustomMacros =
    profile.calorieMode === 'custom' &&
    (profile.customProtein > 0 || profile.customCarbs > 0 || profile.customFat > 0)

  const protein = hasCustomMacros
    ? Math.round(profile.customProtein)
    : Math.round((target * phaseSplit.protein) / 100 / 4)
  const carbs = hasCustomMacros
    ? Math.round(profile.customCarbs)
    : Math.round((target * phaseSplit.carbs) / 100 / 4)
  const fat = hasCustomMacros
    ? Math.round(profile.customFat)
    : Math.round((target * phaseSplit.fat) / 100 / 9)

  let split = phaseSplit
  if (hasCustomMacros) {
    const proteinCalories = protein * 4
    const carbsCalories = carbs * 4
    const fatCalories = fat * 9
    const macroCalories = proteinCalories + carbsCalories + fatCalories
    if (macroCalories > 0) {
      const proteinPercent = Math.round((proteinCalories / macroCalories) * 100)
      const carbsPercent = Math.round((carbsCalories / macroCalories) * 100)
      split = {
        protein: proteinPercent,
        carbs: carbsPercent,
        fat: Math.max(0, 100 - proteinPercent - carbsPercent),
      }
    }
  }

  const waterTarget = Math.round(Math.min(3200, Math.max(1800, weight * 30)) / 100) * 100

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target,
    recommendedTarget,
    phaseAdjustment,
    goalAdjustment,
    macros: { protein, carbs, fat },
    split,
    waterTarget,
  }
}

export function calculateTotals(entries: FoodEntry[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (totals, entry) => {
      totals.calories += entry.calories
      totals.protein += entry.protein
      totals.carbs += entry.carbs
      totals.fat += entry.fat
      return totals
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
