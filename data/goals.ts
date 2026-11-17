import type { Goal } from '~/types'

export interface GoalMeta {
  value: Goal
  label: string
  hint: string
  icon: string
  calorieAdjustment: number
  mealNote: string
  tags: string[]
}

export const GOAL_LIST: Goal[] = ['loseWeight', 'conceive', 'buildMuscle', 'energy']

export const GOAL_META: Record<Goal, GoalMeta> = {
  loseWeight: {
    value: 'loseWeight',
    label: 'Lose weight',
    hint: 'A gentle, satisfying deficit',
    icon: 'leaf',
    calorieAdjustment: -200,
    mealNote: 'satisfying, protein-forward meals',
    tags: ['satiety', 'protein'],
  },
  conceive: {
    value: 'conceive',
    label: 'Conceive a baby',
    hint: 'Fertility-supportive nutrition',
    icon: 'heart',
    calorieAdjustment: 100,
    mealNote: 'fertility-supportive nutrition',
    tags: ['folate', 'omega-3'],
  },
  buildMuscle: {
    value: 'buildMuscle',
    label: 'Build muscle',
    hint: 'More protein and recovery fuel',
    icon: 'bolt',
    calorieAdjustment: 250,
    mealNote: 'muscle-building protein and recovery',
    tags: ['protein', 'recovery'],
  },
  energy: {
    value: 'energy',
    label: 'Have more energy',
    hint: 'Steady, sustained fuel',
    icon: 'sun',
    calorieAdjustment: 150,
    mealNote: 'steady everyday energy',
    tags: ['steady energy', 'complex carbs'],
  },
}

const LEGACY_GOAL_MAP: Record<string, Goal> = {
  maintain: 'energy',
  strength: 'buildMuscle',
  energy: 'energy',
  loseWeight: 'loseWeight',
  conceive: 'conceive',
  buildMuscle: 'buildMuscle',
}

export function normalizeGoal(value: unknown): Goal {
  if (typeof value === 'string' && (GOAL_LIST as string[]).includes(value)) return value as Goal
  if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(LEGACY_GOAL_MAP, value)) {
    return LEGACY_GOAL_MAP[value] ?? 'energy'
  }
  return 'energy'
}
