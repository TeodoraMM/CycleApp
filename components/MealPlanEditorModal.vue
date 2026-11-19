<script setup lang="ts">
import type { DietPreference, MealPlanMeal, MealType } from '~/types'
import { MEAL_INGREDIENTS, MEAL_SLOT_LABELS } from '~/data/mealPlans'
import { useAuth } from '~/composables/useAuth'
import { isDateKey, todayKey } from '~/utils/date'
import { useModalAccessibility } from '~/composables/useModalAccessibility'

interface DraftIngredient {
  name: string
  grams: number
  baseGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

const MEAL_SLOT_OPTIONS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

const props = defineProps<{
  open: boolean
  meal: MealPlanMeal | null
  diet: DietPreference
  date: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { addDiaryEntry, isAuthenticated } = useAuth()

const drafts = ref<DraftIngredient[]>([])
const selectedDate = ref(props.date)
const selectedMeal = ref<MealType>(props.meal?.slot ?? 'breakfast')
const saving = ref(false)
const error = ref('')

const today = todayKey()
const mealLabel = computed(() => (props.meal ? MEAL_SLOT_LABELS[props.meal.slot] : 'Meal'))

function validGrams(value: number): boolean {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 1 && amount <= 2000
}

const isValidDate = computed(() => isDateKey(selectedDate.value) && selectedDate.value <= today)

const canSave = computed(
  () =>
    Boolean(props.meal) &&
    drafts.value.length > 0 &&
    drafts.value.every((item) => validGrams(item.grams)) &&
    isValidDate.value &&
    !saving.value,
)

const preview = computed(() =>
  drafts.value.reduce(
    (total, item) => {
      const amount = validGrams(item.grams) ? Number(item.grams) : 0
      const factor = amount / item.baseGrams
      total.calories += item.calories * factor
      total.protein += item.protein * factor
      total.carbs += item.carbs * factor
      total.fat += item.fat * factor
      return total
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  ),
)

function reset(): void {
  const ingredients = props.meal ? MEAL_INGREDIENTS[props.diet][props.meal.slot] : []
  drafts.value = ingredients.map((ingredient) => ({
    name: ingredient.name,
    grams: ingredient.grams,
    baseGrams: ingredient.grams,
    calories: ingredient.calories,
    protein: ingredient.protein,
    carbs: ingredient.carbs,
    fat: ingredient.fat,
  }))
  selectedDate.value = props.date
  selectedMeal.value = props.meal?.slot ?? 'breakfast'
  saving.value = false
  error.value = ''
}

function resetItem(index: number): void {
  const item = drafts.value[index]
  if (item) item.grams = item.baseGrams
}

function close(): void {
  if (saving.value) return
  emit('close')
}

useModalAccessibility(computed(() => props.open), close, { allowEscape: () => !saving.value })

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  },
)

watch(
  () => [props.meal, props.diet, props.date],
  () => {
    if (props.open) reset()
  },
)

async function addToDiary(): Promise<void> {
  if (!canSave.value || !props.meal || !isAuthenticated.value) return
  saving.value = true
  error.value = ''
  try {
    for (const item of drafts.value) {
      const amount = Math.round(Number(item.grams))
      const factor = amount / item.baseGrams
      await addDiaryEntry({
        name: item.name,
        serving: `${amount} g`,
        calories: Math.max(1, Math.round(item.calories * factor)),
        protein: Math.round(item.protein * factor * 10) / 10,
        carbs: Math.round(item.carbs * factor * 10) / 10,
        fat: Math.round(item.fat * factor * 10) / 10,
        date: selectedDate.value,
        meal: selectedMeal.value,
      })
    }
    emit('saved')
    emit('close')
  } catch {
    error.value = 'Could not add this meal to your diary. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open && meal" class="modal-backdrop" @click.self="close">
        <section
          class="animate-fade-up modal-panel bg-cream"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-editor-title"
        >
          <div class="modal-header flex-col items-stretch justify-start">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="eyebrow">{{ mealLabel }}</p>
                <h2 id="meal-editor-title" class="mt-1 font-display text-xl font-semibold leading-tight text-ink">
                  {{ meal.title }}
                </h2>
                <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                  Adjust the portions, then save every ingredient to your diary.
                </p>
              </div>
              <button
                type="button"
                class="btn-icon shrink-0"
                aria-label="Close meal editor"
                :disabled="saving"
                @click="close"
              >
                <AppIcon name="x" :size="16" />
              </button>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="label">Add to Meal</span>
                <select v-model="selectedMeal" class="input mt-1">
                  <option
                    v-for="slot in MEAL_SLOT_OPTIONS"
                    :key="slot"
                    :value="slot"
                  >
                    {{ MEAL_SLOT_LABELS[slot] }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="label">Date</span>
                <input v-model="selectedDate" type="date" class="input mt-1" :max="today" />
              </label>
            </div>
            <p v-if="!isValidDate" class="mt-1 text-[11px] font-medium text-blush-600">
              Choose a valid date up to today.
            </p>
          </div>

          <div class="modal-body space-y-2">
            <p v-if="!drafts.length" class="py-8 text-center text-sm text-ink-soft">
              No ingredient suggestions are available for this meal.
            </p>
            <div
              v-for="(item, index) in drafts"
              :key="`${item.name}-${index}`"
              class="rounded-2xl border border-white/80 bg-white/75 px-3.5 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="min-w-0 truncate text-sm font-semibold text-ink">{{ item.name }}</p>
                <p class="shrink-0 text-[11px] text-ink-soft">{{ item.baseGrams }} g suggested</p>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <input
                  v-model.number="item.grams"
                  type="number"
                  min="1"
                  max="2000"
                  step="5"
                  inputmode="decimal"
                  class="input min-w-0 flex-1"
                  :aria-label="`${item.name} grams`"
                />
                <span class="shrink-0 text-xs font-semibold text-ink-soft">g</span>
                <button
                  type="button"
                  class="btn-soft min-h-11 shrink-0 px-2.5 py-2 text-[11px] sm:min-h-0"
                  :disabled="saving"
                  @click="resetItem(index)"
                >
                  Reset
                </button>
              </div>
              <p v-if="!validGrams(item.grams)" class="mt-1 text-[11px] font-medium text-blush-600">
                Enter an amount between 1 and 2000 g.
              </p>
            </div>
          </div>

          <div class="modal-footer sm:flex-col sm:items-stretch">
            <p class="eyebrow">Meal total</p>
            <div class="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div class="rounded-2xl bg-cream-100 px-2 py-2 text-center">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Kcal</p>

                <p class="mt-0.5 font-display text-base font-semibold text-ink">
                  {{ Math.round(preview.calories) }}
                </p>
              </div>
              <div class="rounded-2xl bg-plum-50 px-2 py-2 text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-plum-500">Protein</p>
                <p class="mt-0.5 font-display text-base font-semibold text-ink">
                  {{ Math.round(preview.protein) }} g
                </p>
              </div>
              <div class="rounded-2xl bg-blush-50 px-2 py-2 text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-blush-700">Carbs</p>
                <p class="mt-0.5 font-display text-base font-semibold text-ink">
                  {{ Math.round(preview.carbs) }} g
                </p>
              </div>
              <div class="rounded-2xl bg-lavender-50 px-2 py-2 text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-lavender-700">Fat</p>
                <p class="mt-0.5 font-display text-base font-semibold text-ink">
                  {{ Math.round(preview.fat) }} g
                </p>
              </div>
            </div>

            <p v-if="error" class="mt-3 text-[11px] font-medium text-blush-600" role="alert">
              {{ error }}
            </p>
            <p v-if="!isAuthenticated" class="mt-3 text-[11px] leading-relaxed text-ink-soft">
              Sign in to save this meal to your diary.
            </p>

            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="btn-primary flex-1"
                :disabled="!canSave || !isAuthenticated"
                @click="addToDiary"
              >
                <AppIcon name="check" :size="14" />
                {{ saving ? 'Adding...' : 'Add Meal to Diary' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
