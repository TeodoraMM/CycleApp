import type { MealPlanSuggestion, MealType, Phase, UserProfile } from '~/types'
import type { NutritionTargets } from '~/composables/useNutrition'
import { PHASE_META } from '~/data/phases'
import { GOAL_META } from '~/data/goals'
import { DIET_LABELS, MEAL_SLOT_SHARE, MEAL_TEMPLATES } from '~/data/mealPlans'

const SLOT_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function buildMealPlan(
  profile: UserProfile,
  targets: NutritionTargets,
  phase: Phase | null,
): MealPlanSuggestion {
  const phaseMeta = phase ? PHASE_META[phase] : null
  const phaseNutrients = phaseMeta?.nutrients.slice(0, 2) ?? []
  const goalMeta = GOAL_META[profile.goal] ?? GOAL_META.energy

  const items = SLOT_ORDER.map((slot) => {
    const template = MEAL_TEMPLATES[profile.dietPreference][slot]
    const share = MEAL_SLOT_SHARE[slot]
    const tags = [...new Set([...template.tags, ...goalMeta.tags, ...phaseNutrients])]

    return {
      slot,
      title: template.title,
      description: template.description,
      calories: Math.round((targets.target * share) / 10) * 10,
      protein: Math.round(targets.macros.protein * share),
      carbs: Math.round(targets.macros.carbs * share),
      fat: Math.round(targets.macros.fat * share),
      tags,
    }
  })

  const totals = items.reduce(
    (sum, item) => {
      sum.calories += item.calories
      sum.protein += item.protein
      sum.carbs += item.carbs
      sum.fat += item.fat
      return sum
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const phaseCopy = phaseMeta
    ? `, with ${phaseNutrients.join(' and ').toLowerCase()} focus for your ${phaseMeta.label.toLowerCase()} phase`
    : ''
  const note = `Built around your ${DIET_LABELS[profile.dietPreference].toLowerCase()} preference and ${targets.target} kcal target for ${goalMeta.mealNote}${phaseCopy}.`

  return {
    phase,
    targetCalories: targets.target,
    totals,
    items,
    note,
  }
}
