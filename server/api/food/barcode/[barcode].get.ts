import {
  OFF_BARCODE_URL,
  normalizeOffProduct,
  offHeaders,
  type OffProduct,
} from '../../../utils/openFoodFacts'

export default defineEventHandler(async (event) => {
  const barcode = String(getRouterParam(event, 'barcode') ?? '').trim()

  if (!/^\d{6,14}$/.test(barcode)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Enter a barcode with 6 to 14 digits',
    })
  }

  const url = `${OFF_BARCODE_URL}/${encodeURIComponent(barcode)}.json`

  try {
    const response = await fetch(url, { headers: offHeaders() })

    if (response.status === 404) {
      return { product: null }
    }
    if (!response.ok) {
      throw new Error(`Open Food Facts responded with ${response.status}`)
    }

    const data = (await response.json()) as { status?: number; product?: OffProduct }
    if (data.status === 0) {
      return { product: null }
    }

    return { product: normalizeOffProduct(data.product) }
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Open Food Facts lookup failed',
      data: { message: error instanceof Error ? error.message : 'Unknown error' },
    })
  }
})
