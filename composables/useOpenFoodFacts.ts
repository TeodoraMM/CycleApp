import type { OffFood } from '~/types'

export function useOpenFoodFacts() {
  async function searchFoods(query: string): Promise<OffFood[]> {
    const term = query.trim()
    if (term.length < 2) return []

    const data = await $fetch<{ products: OffFood[] }>('/api/food/search', {
      query: { q: term },
    })
    return data.products ?? []
  }

  async function lookupBarcode(barcode: string): Promise<OffFood | null> {
    const code = barcode.trim()
    if (!code) return null

    const data = await $fetch<{ product: OffFood | null }>(
      `/api/food/barcode/${encodeURIComponent(code)}`,
    )
    return data.product ?? null
  }

  return { searchFoods, lookupBarcode }
}
