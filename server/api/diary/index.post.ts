import type { MealType } from '~/types'
import { createDiaryEntry } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function numberValue(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody<Record<string, unknown>>(event)

  const date = typeof body?.date === 'string' ? body.date.trim() : ''
  const meal = typeof body?.meal === 'string' ? body.meal : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const serving = typeof body?.serving === 'string' ? body.serving.trim() : ''
  const calories = numberValue(body?.calories)
  const protein = numberValue(body?.protein)
  const carbs = numberValue(body?.carbs)
  const fat = numberValue(body?.fat)

  if (!DATE_PATTERN.test(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid diary date.' })
  }

  if (!MEAL_TYPES.includes(meal as MealType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid meal type.' })
  }

  if (!name || name.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Food name is required.' })
  }

  if (!serving || serving.length > 80) {
    throw createError({ statusCode: 400, statusMessage: 'Serving is required.' })
  }

  if (!Number.isFinite(calories) || calories <= 0 || calories > 10000) {
    throw createError({ statusCode: 400, statusMessage: 'Enter valid calories.' })
  }

  if (
    [protein, carbs, fat].some(
      (value) => !Number.isFinite(value) || value < 0 || value > 1000,
    )
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Enter valid macros.' })
  }

  const entry = createDiaryEntry(user.id, {
    date,
    meal: meal as MealType,
    name,
    serving,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  })

  return { entry }
})
