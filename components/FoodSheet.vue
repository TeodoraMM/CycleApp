<script setup lang="ts">
import type { CustomFoodInput, MealType, OffFood, PresetFood } from '~/types'
import { FOOD_PRESETS } from '~/data/foods'
import { useOpenFoodFacts } from '~/composables/useOpenFoodFacts'
import { useModalAccessibility } from '~/composables/useModalAccessibility'

const props = defineProps<{
  open: boolean
  meal: MealType
}>()

const emit = defineEmits<{
  close: []
  addPreset: [preset: PresetFood]
  addCustom: [input: CustomFoodInput]
}>()

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const mode = ref<'quick' | 'online' | 'custom'>('quick')
const query = ref('')
const selectedFood = ref<PresetFood | null>(null)
const grams = ref(0)
const custom = reactive({
  name: '',
  serving: '1 serving',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

const { searchFoods, lookupBarcode } = useOpenFoodFacts()

const offQuery = ref('')
const offResults = ref<OffFood[]>([])
const offLoading = ref(false)
const offError = ref('')
const barcode = ref('')
const barcodeLoading = ref(false)
const barcodeError = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchRequest = 0

const results = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return FOOD_PRESETS
  return FOOD_PRESETS.filter(
    (food) =>
      food.name.toLowerCase().includes(term) ||
      food.tags.some((tag) => tag.toLowerCase().includes(term)),
  )
})

const rawGrams = computed(() => Number(grams.value))
const isValidGrams = computed(
  () => Number.isFinite(rawGrams.value) && rawGrams.value >= 1 && rawGrams.value <= 2000,
)
const portion = computed(() => {
  const food = selectedFood.value
  if (!food || !isValidGrams.value) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const factor = rawGrams.value / food.grams
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  }
})
const canAddPortion = computed(() => Boolean(selectedFood.value) && isValidGrams.value)

function selectFood(food: PresetFood): void {
  selectedFood.value = food
  grams.value = food.grams
}

function clearSelection(): void {
  selectedFood.value = null
  grams.value = 0
}

function close(): void {
  emit('close')
}

useModalAccessibility(computed(() => props.open), close)

function submitPortion(): void {
  const food = selectedFood.value
  if (!food || !canAddPortion.value) return
  const amount = Math.round(rawGrams.value)
  emit('addPreset', {
    ...food,
    id: `${food.id}-${amount}g`,
    serving: `${amount} g`,
    grams: amount,
    ...portion.value,
  })
}

function foodFromOff(item: OffFood): PresetFood {
  return {
    id: `off-${item.code || item.name}`,
    name: item.brand ? `${item.name} · ${item.brand}` : item.name,
    serving: '100 g',
    grams: 100,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    tags: [],
    per100g: true,
  }
}

function selectOffFood(item: OffFood): void {
  selectFood(foodFromOff(item))
}

async function runOffSearch(): Promise<void> {
  const term = offQuery.value.trim()
  const requestId = ++searchRequest
  offLoading.value = true
  offError.value = ''
  try {
    const products = await searchFoods(term)
    if (requestId !== searchRequest) return
    offResults.value = products
  } catch {
    if (requestId !== searchRequest) return
    offResults.value = []
    offError.value = 'Could not load food results. Please try again.'
  } finally {
    if (requestId === searchRequest) offLoading.value = false
  }
}

watch(offQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchRequest++
  offResults.value = []
  offError.value = ''
  const term = offQuery.value.trim()
  if (term.length < 2) {
    offLoading.value = false
    return
  }
  offLoading.value = true
  searchTimer = setTimeout(() => {
    void runOffSearch()
  }, 450)
})

async function submitBarcode(): Promise<void> {
  barcodeError.value = ''
  const code = barcode.value.trim()
  if (!/^\d{6,14}$/.test(code)) {
    barcodeError.value = 'Enter a barcode with 6 to 14 digits.'
    return
  }
  barcodeLoading.value = true
  try {
    const item = await lookupBarcode(code)
    if (!item) {
      barcodeError.value = 'No product found for this barcode.'
      return
    }
    barcode.value = ''
    selectOffFood(item)
  } catch {
    barcodeError.value = 'Could not reach Open Food Facts. Please try again.'
  } finally {
    barcodeLoading.value = false
  }
}

function resetOnlineSearch(): void {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  searchRequest++
  offQuery.value = ''
  offResults.value = []
  offLoading.value = false
  offError.value = ''
  barcode.value = ''
  barcodeLoading.value = false
  barcodeError.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    mode.value = 'quick'
    query.value = ''
    clearSelection()
    resetOnlineSearch()
    Object.assign(custom, { name: '', serving: '1 serving', calories: 0, protein: 0, carbs: 0, fat: 0 })
  },
)

watch(mode, () => {
  clearSelection()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

const canSubmitCustom = computed(
  () => custom.name.trim().length > 0 && Number(custom.calories) > 0,
)

function submitCustom(): void {
  if (!canSubmitCustom.value) return
  emit('addCustom', {
    name: custom.name.trim(),
    serving: custom.serving.trim() || '1 serving',
    calories: Math.round(Number(custom.calories)),
    protein: Math.max(0, Number(custom.protein) || 0),
    carbs: Math.max(0, Number(custom.carbs) || 0),
    fat: Math.max(0, Number(custom.fat) || 0),
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <section
          class="animate-fade-up modal-panel bg-cream sm:max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="food-sheet-title"
        >
          <div class="modal-header flex-col items-stretch justify-start">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">Add to {{ MEAL_LABELS[meal] }}</p>
                <h2 id="food-sheet-title" class="font-display text-xl font-semibold text-ink">What are you having?</h2>
              </div>
              <button type="button" class="btn-icon shrink-0" aria-label="Close" @click="close">
                <AppIcon name="x" :size="16" />
              </button>
            </div>

          <div class="mt-4 flex gap-1 rounded-full bg-white/70 p-1">
            <button
              type="button"
              class="flex min-h-11 flex-1 items-center justify-center rounded-full px-1 py-2 text-[11px] font-semibold transition sm:min-h-0 sm:px-3 sm:text-xs"
              :class="mode === 'quick' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
              @click="mode = 'quick'"
            >
              Quick add
            </button>
            <button
              type="button"
              class="flex min-h-11 flex-1 items-center justify-center rounded-full px-1 py-2 text-[11px] font-semibold transition sm:min-h-0 sm:px-3 sm:text-xs"
              :class="mode === 'online' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
              @click="mode = 'online'"
            >
              Online
            </button>
            <button
              type="button"
              class="flex min-h-11 flex-1 items-center justify-center rounded-full px-1 py-2 text-[11px] font-semibold transition sm:min-h-0 sm:px-3 sm:text-xs"
              :class="mode === 'custom' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
              @click="mode = 'custom'"
            >
              Custom food
            </button>
          </div>
        </div>

        <template v-if="mode !== 'custom'">
          <template v-if="!selectedFood">
            <template v-if="mode === 'quick'">
              <div class="px-5">
                <label class="relative block">
                  <span class="sr-only">Search foods</span>
                  <input v-model="query" type="search" class="input pl-10" placeholder="Search foods or nutrients" />
                  <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-300">
                    <AppIcon name="sparkles" :size="15" />
                  </span>
                </label>
              </div>
              <div class="mt-3 flex-1 overflow-y-auto px-5 pb-8">
                <p v-if="results.length === 0" class="py-10 text-center text-sm text-ink-soft">
                  No matches yet. Try another word or add a custom food.
                </p>
                <ul v-else class="space-y-2">
                  <li v-for="food in results" :key="food.id">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-left transition hover:border-blush-200 hover:bg-white active:scale-[0.99]"
                      @click="selectFood(food)"
                    >
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-semibold text-ink">{{ food.name }}</span>
                        <span class="mt-0.5 block text-[11px] text-ink-soft">
                          {{ food.serving }} · P {{ food.protein }}g · C {{ food.carbs }}g · F {{ food.fat }}g
                        </span>
                      </span>
                      <span class="shrink-0 rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-semibold text-blush-600">
                        {{ food.calories }} kcal
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </template>

            <template v-else>
              <div class="px-5">
                <label class="relative block">
                  <span class="sr-only">Search Open Food Facts</span>
                  <input
                    v-model="offQuery"
                    type="search"
                    class="input pl-10"
                    placeholder="Search whole foods or packaged products"
                  />
                  <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-300">
                    <AppIcon name="sparkles" :size="15" />
                  </span>
                </label>
                <form class="mt-2 flex flex-wrap gap-2 sm:flex-nowrap" @submit.prevent="submitBarcode">
                  <label class="relative block min-w-[9rem] flex-1">
                    <span class="sr-only">Enter a barcode</span>
                    <input
                      v-model="barcode"
                      type="text"
                      inputmode="numeric"
                      class="input"
                      placeholder="Or enter a barcode"
                    />
                  </label>
                  <button type="submit" class="btn-soft min-h-11 shrink-0 sm:min-h-0" :disabled="barcodeLoading">
                    <AppIcon name="target" :size="13" />
                    {{ barcodeLoading ? 'Looking...' : 'Look up' }}
                  </button>
                </form>
                <p v-if="barcodeError" class="mt-1 text-[11px] font-medium text-blush-600">{{ barcodeError }}</p>
                <p class="mt-2 text-[11px] leading-relaxed text-ink-soft">
                  Per 100 g values from USDA FoodData Central and Open Food Facts. Adjust the grams after choosing a
                  product.
                </p>
              </div>
              <div class="mt-3 flex-1 overflow-y-auto px-5 pb-8">
                <p v-if="offLoading" class="py-8 text-center text-sm text-ink-soft">
                  Searching Open Food Facts...
                </p>
                <p v-else-if="offError" class="py-8 text-center text-sm text-ink-soft">{{ offError }}</p>
                <p v-else-if="offQuery.trim().length < 2" class="py-8 text-center text-sm text-ink-soft">
                  Type at least 2 characters to search online.
                </p>
                <p v-else-if="offResults.length === 0" class="py-8 text-center text-sm text-ink-soft">
                  No foods found. Try a different word or a barcode.
                </p>
                <ul v-else class="space-y-2">
                  <li v-for="item in offResults" :key="`${item.code}-${item.name}`">
                    <button
                      type="button"
                      class="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-left transition hover:border-blush-200 hover:bg-white active:scale-[0.99]"
                      @click="selectOffFood(item)"
                    >
                      <span class="min-w-0">
                        <span class="flex items-center gap-1.5">
                          <span class="block min-w-0 truncate text-sm font-semibold text-ink">{{ item.name }}</span>
                          <span
                            v-if="item.source === 'usda'"
                            class="shrink-0 rounded-full bg-plum-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-plum-600"
                          >
                            Whole Food
                          </span>
                        </span>
                        <span class="mt-0.5 block truncate text-[11px] text-ink-soft">
                          {{ item.brand || (item.source === 'usda' ? 'Generic / Whole Food' : 'Open Food Facts') }} · P
                          {{ item.protein }}g · C {{ item.carbs }}g · F {{ item.fat }}g
                        </span>
                      </span>
                      <span class="shrink-0 rounded-full bg-blush-50 px-2.5 py-1 text-[11px] font-semibold text-blush-600">
                        {{ item.calories }} kcal /100g
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            </template>
          </template>

          <div v-else class="mt-3 flex-1 overflow-y-auto px-5 pb-8">
            <button type="button" class="btn-soft mb-3 min-h-11 sm:min-h-0" @click="clearSelection">
              <AppIcon name="chevron-left" :size="13" />
              {{ mode === 'online' ? 'Back to search' : 'All foods' }}
            </button>

            <div class="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-soft">
              <p class="eyebrow">Set your portion</p>
              <h3 class="mt-1 font-display text-lg font-semibold text-ink">{{ selectedFood.name }}</h3>
              <p class="mt-1 text-xs leading-relaxed text-ink-soft">
                <template v-if="selectedFood.per100g">
                  Nutrition values are per 100 g. Adjust the grams to match what you are having.
                </template>
                <template v-else>
                  {{ selectedFood.serving }} is about {{ selectedFood.grams }} g. Adjust the grams to match what you
                  are having.
                </template>
              </p>

              <div class="mt-4">
                <label class="label" for="quick-grams">Amount (g)</label>
                <input
                  id="quick-grams"
                  v-model.number="grams"
                  type="number"
                  min="1"
                  max="2000"
                  step="5"
                  inputmode="decimal"
                  class="input mt-1"
                />
                <p v-if="!isValidGrams" class="mt-1 text-[11px] font-medium text-blush-600">
                  Enter an amount between 1 and 2000 g.
                </p>
              </div>

               <div class="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">

                <div class="rounded-2xl bg-cream-100 px-2 py-2 text-center">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-soft"
>Kcal</p>
                  <p class="mt-0.5 font-display text-base font-semibold text-ink">{{ portion.calories }}</p>
                </div>
                <div class="rounded-2xl bg-plum-50 px-2 py-2 text-center">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-plum-500">Protein</p>
                  <p class="mt-0.5 font-display text-base font-semibold text-ink">{{ portion.protein }} g</p>
                </div>
                <div class="rounded-2xl bg-blush-50 px-2 py-2 text-center">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-blush-700">Carbs</p>
                  <p class="mt-0.5 font-display text-base font-semibold text-ink">{{ portion.carbs }} g</p>
                </div>
                <div class="rounded-2xl bg-lavender-50 px-2 py-2 text-center">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-lavender-700">Fat</p>
                  <p class="mt-0.5 font-display text-base font-semibold text-ink">{{ portion.fat }} g</p>
                </div>
              </div>

              <div class="mt-4 flex gap-2">
                <button type="button" class="btn-soft min-h-11 sm:min-h-0" @click="clearSelection">Back</button>
                <button
                  type="button"
                  class="btn-primary flex-1"
                  :disabled="!canAddPortion"
                  @click="submitPortion"
                >
                  Add to {{ MEAL_LABELS[meal] }}
                  <AppIcon name="arrow-right" :size="14" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <form v-else class="flex-1 overflow-y-auto px-5 pb-8" @submit.prevent="submitCustom">
          <div class="space-y-3">
            <div>
              <label class="label" for="food-name">Food name</label>
              <input id="food-name" v-model="custom.name" class="input mt-1" placeholder="e.g. Homemade soup" />
            </div>
            <div>
              <label class="label" for="food-serving">Serving</label>
              <input id="food-serving" v-model="custom.serving" class="input mt-1" placeholder="1 bowl" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label" for="food-calories">Calories</label>
                <input id="food-calories" v-model.number="custom.calories" type="number" min="0" class="input mt-1" placeholder="0" />
              </div>
              <div>
                <label class="label" for="food-protein">Protein (g)</label>
                <input id="food-protein" v-model.number="custom.protein" type="number" min="0" class="input mt-1" placeholder="0" />
              </div>
              <div>
                <label class="label" for="food-carbs">Carbs (g)</label>
                <input id="food-carbs" v-model.number="custom.carbs" type="number" min="0" class="input mt-1" placeholder="0" />
              </div>
              <div>
                <label class="label" for="food-fat">Fat (g)</label>
                <input id="food-fat" v-model.number="custom.fat" type="number" min="0" class="input mt-1" placeholder="0" />
              </div>
            </div>
          </div>
          <button type="submit" class="btn-primary mt-5 w-full" :disabled="!canSubmitCustom">
            Add to {{ MEAL_LABELS[meal] }}
          </button>
          <p class="mt-3 text-center text-[11px] text-ink-soft">
            Estimates are completely okay. Consistency matters more than precision.
          </p>
        </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
