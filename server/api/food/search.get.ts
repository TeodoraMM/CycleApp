import type { OffFood } from '~/types'
import { OFF_SEARCH_URL, normalizeOffProduct, offHeaders, type OffProduct } from '../../utils/openFoodFacts'
import { searchUsdaFoods } from '../../utils/usdaFoodData'

async function searchOpenFoodFacts(term: string): Promise<OffFood[]> {
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '40',
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'romania',
    fields:
      'code,product_name,product_name_ro,product_name_en,generic_name,brands,quantity,nutriments',
  })

  const response = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
    headers: offHeaders(),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`Open Food Facts responded with ${response.status}`)
  }

  const data = (await response.json()) as { products?: OffProduct[] }
  const seen = new Set<string>()
  const products: OffFood[] = []

  for (const raw of data.products ?? []) {
    const item = normalizeOffProduct(raw)
    if (!item) continue
    if (!item.calories && !item.protein && !item.carbs && !item.fat) continue

    const key = item.code || `${item.name}|${item.brand}`
    if (seen.has(key)) continue

    seen.add(key)
    products.push(item)
    if (products.length >= 20) break
  }

  return products
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = String(query.q ?? '').trim()

  if (term.length < 2) {
    return { products: [] as OffFood[] }
  }

  const apiKey = process.env.USDA_API_KEY?.trim() || ''

  const [usdaResult, offResult] = await Promise.allSettled([
    searchUsdaFoods(term, apiKey),
    searchOpenFoodFacts(term),
  ])

  if (usdaResult.status === 'rejected') {
    console.warn('[food search] USDA failed:', usdaResult.reason)
  }
  if (offResult.status === 'rejected') {
    console.warn('[food search] Open Food Facts failed:', offResult.reason)
  }

  const usdaProducts = usdaResult.status === 'fulfilled' ? usdaResult.value : []
  const offProducts = offResult.status === 'fulfilled' ? offResult.value : []

  return { products: [...usdaProducts, ...offProducts] }
})
