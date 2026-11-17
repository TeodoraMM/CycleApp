import type { OffFood } from '~/types'

export const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'

export interface UsdaNutrient {
  nutrientId?: number
  nutrientName?: string
  unitName?: string
  value?: number | string
}

export interface UsdaFood {
  fdcId?: number | string
  description?: string
  dataType?: string
  foodNutrients?: UsdaNutrient[]
}

export interface UsdaSearchResponse {
  foods?: UsdaFood[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10
}

function nutrientValue(food: UsdaFood, nutrientId: number): number {
  const match = food.foodNutrients?.find((nutrient) => Number(nutrient.nutrientId) === nutrientId)
  return toNumber(match?.value)
}

export function normalizeUsdaFood(food: UsdaFood | null | undefined): OffFood | null {
  if (!food) return null

  const name = typeof food.description === 'string' ? food.description.trim() : ''
  if (!name) return null

  return {
    code: `usda-${food.fdcId ?? name}`,
    name,
    brand: 'Generic / Whole Food',
    quantity: '',
    calories: Math.round(nutrientValue(food, 1008)),
    protein: roundOne(nutrientValue(food, 1003)),
    carbs: roundOne(nutrientValue(food, 1005)),
    fat: roundOne(nutrientValue(food, 1004)),
    source: 'usda',
  }
}

export async function searchUsdaFoods(term: string, apiKey: string): Promise<OffFood[]> {
  if (!apiKey.trim()) {
    throw new Error('USDA API key is not configured')
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    query: term,
    dataType: 'Foundation,SR Legacy',
    pageSize: '5',
  })

  const response = await fetch(`${USDA_SEARCH_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`USDA FoodData Central responded with ${response.status}`)
  }

  const data = (await response.json()) as UsdaSearchResponse
  return (data.foods ?? [])
    .map(normalizeUsdaFood)
    .filter((item): item is OffFood => item !== null)
}
