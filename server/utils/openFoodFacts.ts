import type { OffFood } from '~/types'

export const OFF_USER_AGENT = 'MyNutritionApp/1.0 (contact@example.com)'
export const OFF_SEARCH_URL = 'https://ro.openfoodfacts.org/cgi/search.pl'
export const OFF_BARCODE_URL = 'https://world.openfoodfacts.org/api/v2/product'

export interface OffNutriments {
  [key: string]: unknown
}

export interface OffProduct {
  code?: string
  product_name?: string
  product_name_ro?: string
  product_name_en?: string
  generic_name?: string
  brands?: string
  quantity?: string
  nutriments?: OffNutriments
}

export function offHeaders(): Record<string, string> {
  return {
    'User-Agent': OFF_USER_AGENT,
    Accept: 'application/json',
  }
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

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

export function normalizeOffProduct(product: OffProduct | null | undefined): OffFood | null {
  if (!product) return null

  const name = firstText(
    product.product_name_ro,
    product.product_name,
    product.product_name_en,
    product.generic_name,
  )
  if (!name) return null

  const nutriments = product.nutriments ?? {}
  const energyKcal = toNumber(nutriments['energy-kcal_100g'])
  const energyKj = toNumber(nutriments['energy_100g'])
  const calories = energyKcal > 0 ? Math.round(energyKcal) : energyKj > 0 ? Math.round(energyKj / 4.184) : 0

  return {
    code: firstText(product.code),
    name,
    brand: firstText(product.brands),
    quantity: firstText(product.quantity),
    calories,
    protein: roundOne(toNumber(nutriments['proteins_100g'])),
    carbs: roundOne(toNumber(nutriments['carbohydrates_100g'])),
    fat: roundOne(toNumber(nutriments['fat_100g'])),
    source: 'off',
  }
}
