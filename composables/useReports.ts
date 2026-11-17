import type { AppState, Phase } from '~/types'
import { addDaysToKey, todayKey } from '~/utils/date'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'

export interface ReportPoint {
  key: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  target: number
  phase: Phase
  hasFood: boolean
}

export interface ReportSummary {
  points: ReportPoint[]
  days: number
  foodDays: number
  avgCalories: number
  avgTarget: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  avgWater: number
  waterTarget: number
  consistency: number
  calorieDelta: number
}

export function buildReport(state: AppState, days: number, endKey = todayKey()): ReportSummary {
  const points: ReportPoint[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const key = addDaysToKey(endKey, -offset)
    const entries = state.foods.filter((entry) => entry.date === key)
    const totals = entries.reduce(
      (accumulator, entry) => {
        accumulator.calories += entry.calories
        accumulator.protein += entry.protein
        accumulator.carbs += entry.carbs
        accumulator.fat += entry.fat
        return accumulator
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
    const log = state.logs[key]
    const phaseInfo = computePhase(key, state.cycle)
    const targets = calculateTargets(state.profile, phaseInfo.ready ? phaseInfo.phase : null)

    points.push({
      key,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      water: log?.waterMl ?? 0,
      target: targets.target,
      phase: phaseInfo.phase,
      hasFood: entries.length > 0,
    })
  }

  const active = points.filter((point) => point.hasFood || point.water > 0)
  const foodPoints = points.filter((point) => point.hasFood)
  const waterPoints = points.filter((point) => point.water > 0)

  const average = (values: number[]): number =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

  const avgCalories = average(foodPoints.map((point) => point.calories))
  const avgTarget = average(active.map((point) => point.target))
  const avgWater = average(waterPoints.map((point) => point.water))
  const currentTargets = calculateTargets(state.profile, null)

  return {
    points,
    days,
    foodDays: foodPoints.length,
    avgCalories,
    avgTarget,
    avgProtein: average(foodPoints.map((point) => point.protein)),
    avgCarbs: average(foodPoints.map((point) => point.carbs)),
    avgFat: average(foodPoints.map((point) => point.fat)),
    avgWater,
    waterTarget: currentTargets.waterTarget,
    consistency: Math.round((foodPoints.length / days) * 100),
    calorieDelta: avgCalories - avgTarget,
  }
}
