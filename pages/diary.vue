<script setup lang="ts">
import type { CustomFoodInput, MealType, PresetFood } from '~/types'
import { useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets, calculateTotals } from '~/composables/useNutrition'
import { addDaysToKey, formatLong, formatMedium, formatNumber, todayKey } from '~/utils/date'

definePageMeta({ middleware: 'auth' })

const { state } = useAppState()
const { addDiaryEntry, removeDiaryEntry } = useAuth()

const today = todayKey()
const selectedDate = ref(today)
const sheetOpen = ref(false)
const activeMeal = ref<MealType>('breakfast')
const diaryError = ref('')
const removingId = ref<string | null>(null)

const meals: Array<{ key: MealType; label: string; icon: string; bubble: string }> = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sun', bubble: 'bg-peach-100 text-peach-600' },
  { key: 'lunch', label: 'Lunch', icon: 'bowl', bubble: 'bg-blush-100 text-blush-600' },
  { key: 'dinner', label: 'Dinner', icon: 'moon', bubble: 'bg-lavender-100 text-lavender-600' },
  { key: 'snack', label: 'Snacks', icon: 'sparkles', bubble: 'bg-plum-100 text-plum-500' },
]

const isTodaySelected = computed(() => selectedDate.value === today)
const phase = computed(() => computePhase(selectedDate.value, state.value.cycle))
const targets = computed(() =>
  calculateTargets(state.value.profile, phase.value.ready ? phase.value.phase : null),
)
const entries = computed(() => state.value.foods.filter((entry) => entry.date === selectedDate.value))
const totals = computed(() => calculateTotals(entries.value))
const calorieProgress = computed(() =>
  targets.value.target > 0 ? totals.value.calories / targets.value.target : 0,
)
const remaining = computed(() => Math.round(targets.value.target - totals.value.calories))

const grouped = computed<Record<MealType, typeof entries.value>>(() => ({
  breakfast: entries.value.filter((entry) => entry.meal === 'breakfast'),
  lunch: entries.value.filter((entry) => entry.meal === 'lunch'),
  dinner: entries.value.filter((entry) => entry.meal === 'dinner'),
  snack: entries.value.filter((entry) => entry.meal === 'snack'),
}))

const mealTotals = computed<Record<MealType, ReturnType<typeof calculateTotals>>>(() => ({
  breakfast: calculateTotals(grouped.value.breakfast),
  lunch: calculateTotals(grouped.value.lunch),
  dinner: calculateTotals(grouped.value.dinner),
  snack: calculateTotals(grouped.value.snack),
}))

function shiftDay(amount: number): void {
  const next = addDaysToKey(selectedDate.value, amount)
  if (next > today) return
  selectedDate.value = next
}

function openSheet(meal: MealType): void {
  activeMeal.value = meal
  sheetOpen.value = true
}

async function handlePreset(preset: PresetFood): Promise<void> {
  diaryError.value = ''
  try {
    await addDiaryEntry({
      name: preset.name,
      serving: preset.serving,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      date: selectedDate.value,
      meal: activeMeal.value,
    })
    sheetOpen.value = false
  } catch {
    diaryError.value = 'Could not add this food. Please try again.'
  }
}

async function handleCustom(input: CustomFoodInput): Promise<void> {
  diaryError.value = ''
  try {
    await addDiaryEntry({
      ...input,
      date: selectedDate.value,
      meal: activeMeal.value,
    })
    sheetOpen.value = false
  } catch {
    diaryError.value = 'Could not add this food. Please try again.'
  }
}

async function handleRemove(id: string): Promise<void> {
  diaryError.value = ''
  removingId.value = id
  try {
    await removeDiaryEntry(id)
  } catch {
    diaryError.value = 'Could not remove this entry. Please try again.'
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="min-w-0 animate-fade-up">
    <header class="min-w-0 pt-2">
      <p class="eyebrow">Food diary</p>
      <h1 class="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        Your nourishment
      </h1>
      <p class="mt-1 text-sm text-ink-soft">Notice patterns with curiosity, not judgement.</p>
    </header>

    <p
      v-if="diaryError"
      class="mt-3 rounded-2xl border border-blush-200/70 bg-blush-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-blush-700"
      role="alert"
    >
      {{ diaryError }}
    </p>

    <section class="card-tight mt-5 min-w-0">
      <div class="flex min-w-0 items-center justify-between gap-2">
        <button type="button" class="btn-icon shrink-0" aria-label="Previous day" @click="shiftDay(-1)">
          <AppIcon name="chevron-left" :size="16" />
        </button>
        <div class="min-w-0 flex-1 px-1 text-center">
          <p class="break-words text-sm font-semibold text-ink">{{ isTodaySelected ? 'Today' : formatMedium(selectedDate) }}</p>
          <p class="break-words text-xs text-ink-soft">{{ formatLong(selectedDate) }}</p>
          <button
            v-if="!isTodaySelected"
            type="button"
            class="mt-1 min-h-11 text-xs font-semibold text-blush-600"
            @click="selectedDate = today"
          >
            Back to today
          </button>
        </div>
        <button
          type="button"
          class="btn-icon shrink-0 disabled:opacity-40"
          aria-label="Next day"
          :disabled="isTodaySelected"
          @click="shiftDay(1)"
        >
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </section>

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="eyebrow">Daily balance</p>
          <h2 class="section-title">{{ formatNumber(totals.calories) }} kcal logged</h2>
        </div>
        <PhaseBadge v-if="phase.ready" :phase="phase.phase" class="shrink-0" />
      </div>

      <template v-if="targets.target > 0">
        <div class="mt-4 flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing
            class="self-center sm:self-auto"
            :progress="calorieProgress"
            :size="116"
            :stroke="9"
            color="#EE6C90"
            color-end="#9A7CCB"
            track="#FFF0F4"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">Target</p>
            <p class="font-display text-xl font-semibold leading-none text-ink">{{ formatNumber(targets.target) }}</p>
            <p class="mt-1 text-xs text-ink-soft">kcal</p>
          </ProgressRing>
          <div class="w-full min-w-0 space-y-3">
            <MacroBar
              label="Protein"
              :value="totals.protein"
              :target="targets.macros.protein"
              bar-class="bg-gradient-to-r from-plum-300 to-plum-500"
            />
            <MacroBar
              label="Carbs"
              :value="totals.carbs"
              :target="targets.macros.carbs"
              bar-class="bg-gradient-to-r from-blush-300 to-blush-500"
            />
            <MacroBar
              label="Fat"
              :value="totals.fat"
              :target="targets.macros.fat"
              bar-class="bg-gradient-to-r from-lavender-300 to-lavender-500"
            />
          </div>
        </div>

        <p class="mt-3 text-xs leading-relaxed text-ink-soft">
          <template v-if="remaining >= 0">{{ remaining }} kcal left in your estimate.</template>
          <template v-else>{{ Math.abs(remaining) }} kcal over your estimate — completely okay.</template>
        </p>
      </template>
      <div v-else class="mt-4 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
        <p class="font-semibold text-ink">No daily targets yet.</p>
        <p class="mt-1 text-xs leading-relaxed">Set up your profile to see calorie and macro targets for this day.</p>
        <NuxtLink to="/profile" class="btn-soft mt-3 inline-flex min-h-11">Set up profile</NuxtLink>
      </div>
    </section>

    <section v-for="meal in meals" :key="meal.key" class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <span class="icon-bubble h-9 w-9" :class="meal.bubble">
            <AppIcon :name="meal.icon" :size="16" />
          </span>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-ink">{{ meal.label }}</h2>
            <p class="text-xs text-ink-soft">
              {{ grouped[meal.key].length }} item{{ grouped[meal.key].length === 1 ? '' : 's' }} ·
              {{ grouped[meal.key].reduce((sum, entry) => sum + entry.calories, 0) }} kcal
            </p>
            <p v-if="grouped[meal.key].length" class="mt-0.5 text-xs leading-relaxed text-ink-soft">
              P {{ Math.round(mealTotals[meal.key].protein) }}g · C
              {{ Math.round(mealTotals[meal.key].carbs) }}g · F {{ Math.round(mealTotals[meal.key].fat) }}g
            </p>
          </div>
        </div>
        <button type="button" class="btn-soft min-h-11 w-full shrink-0 sm:w-auto" @click="openSheet(meal.key)">
          <AppIcon name="plus" :size="13" class="shrink-0" /> Add
        </button>
      </div>

      <ul v-if="grouped[meal.key].length" class="mt-3 space-y-2">
        <li
          v-for="entry in grouped[meal.key]"
          :key="entry.id"
          class="flex min-w-0 items-start gap-2 rounded-2xl bg-white/65 px-3.5 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-ink">{{ entry.name }}</p>
            <p class="text-xs leading-relaxed text-ink-soft">
              {{ entry.serving }} · P {{ entry.protein }}g · C {{ entry.carbs }}g · F {{ entry.fat }}g
            </p>
          </div>
          <span class="shrink-0 whitespace-nowrap text-xs font-semibold text-ink">{{ entry.calories }}</span>
          <button
            type="button"
            class="btn-icon h-11 w-11 shrink-0 bg-transparent text-ink-soft shadow-none transition hover:text-blush-700 disabled:opacity-40 sm:h-10 sm:w-10"
            :aria-label="`Remove ${entry.name}`"
            :disabled="removingId === entry.id"
            @click="handleRemove(entry.id)"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </li>
      </ul>
      <p
        v-else
        class="mt-3 rounded-2xl border border-dashed border-plum-200/60 px-3 py-4 text-center text-xs leading-relaxed text-ink-soft"
      >
        A gentle blank space. Add something whenever you're ready.
      </p>
    </section>

    <p class="mt-5 px-2 text-center text-xs leading-relaxed text-ink-soft">
      Approximate values are welcome here. The goal is awareness, not perfection.
    </p>

    <FoodSheet
      :open="sheetOpen"
      :meal="activeMeal"
      @close="sheetOpen = false"
      @add-preset="handlePreset"
      @add-custom="handleCustom"
    />
  </div>
</template>
