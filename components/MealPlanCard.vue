<script setup lang="ts">
import type { MealPlanMeal } from '~/types'
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import { buildMealPlan } from '~/utils/mealPlan'
import { DIET_LABELS, MEAL_SLOT_ICONS, MEAL_SLOT_LABELS } from '~/data/mealPlans'
import { GOAL_META } from '~/data/goals'
import { formatNumber, todayKey } from '~/utils/date'
import { hasNutritionData } from '~/utils/userState'

const { state } = useAppState()
const today = todayKey()
const phase = computed(() => computePhase(today, state.value.cycle))
const targetsReady = computed(() => hasNutritionData(state.value.profile))
const targets = computed(() =>
  calculateTargets(state.value.profile, phase.value.ready ? phase.value.phase : null),
)
const plan = computed(() =>
  buildMealPlan(
    state.value.profile,
    targets.value,
    phase.value.ready ? phase.value.phase : null,
  ),
)

const editorOpen = ref(false)
const editorMeal = ref<MealPlanMeal | null>(null)
const savedMessage = ref('')

function openEditor(meal: MealPlanMeal): void {
  savedMessage.value = ''
  editorMeal.value = meal
  editorOpen.value = true
}

function handleSaved(): void {
  savedMessage.value = `${editorMeal.value?.title ?? 'Meal'} added to your diary.`
}
</script>

<template>
  <section class="card mt-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="eyebrow">Meal plan</p>
        <h2 class="section-title">Ideas for today</h2>
      </div>
      <PhaseBadge v-if="phase.ready" :phase="phase.phase" class="shrink-0" />
    </div>

    <template v-if="targetsReady">
      <p class="mt-1.5 text-[11px] leading-relaxed text-ink-soft">{{ plan.note }}</p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <span class="chip">{{ formatNumber(plan.targetCalories) }} kcal target</span>
        <span class="chip">{{ GOAL_META[state.profile.goal]?.label ?? 'Energy' }}</span>
        <span class="chip">{{ DIET_LABELS[state.profile.dietPreference] }}</span>
        <span class="chip">
          P {{ plan.totals.protein }}g · C {{ plan.totals.carbs }}g · F {{ plan.totals.fat }}g
        </span>
      </div>

      <ul class="mt-4 space-y-3">
        <li v-for="meal in plan.items" :key="meal.slot" class="rounded-2xl bg-white/65 p-3.5">
          <div class="flex items-start gap-3">
            <span class="icon-bubble h-9 w-9 shrink-0 bg-cream-100 text-plum-600">
              <AppIcon :name="MEAL_SLOT_ICONS[meal.slot]" :size="16" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    {{ MEAL_SLOT_LABELS[meal.slot] }}
                  </p>
                  <p class="mt-0.5 break-words text-sm font-semibold leading-snug text-ink">{{ meal.title }}</p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1.5">
                  <span class="whitespace-nowrap text-xs font-semibold text-ink">{{ meal.calories }} kcal</span>
                  <button
                    type="button"
                    class="btn-icon"
                    title="Customize meal"
                    :aria-label="`Customize ${meal.title}`"
                    @click="openEditor(meal)"
                  >
                    <AppIcon name="pencil" :size="14" />
                  </button>
                </div>
              </div>
              <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">{{ meal.description }}</p>
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
                <span>P {{ meal.protein }}g</span>
                <span>C {{ meal.carbs }}g</span>
                <span>F {{ meal.fat }}g</span>
                <span
                  v-for="tag in meal.tags"
                  :key="tag"
                  class="rounded-full bg-white/75 px-2 py-0.5 text-ink-soft"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <p
        v-if="savedMessage"
        class="mt-3 rounded-2xl bg-plum-50 px-3.5 py-2.5 text-[11px] font-medium text-plum-600"
        role="status"
      >
        {{ savedMessage }}
      </p>

      <p class="mt-3 text-[11px] leading-relaxed text-ink-soft">
        Ideas, not rules. Swap foods to suit what you have and how you feel.
      </p>

      <MealPlanEditorModal
        :open="editorOpen"
        :meal="editorMeal"
        :diet="state.profile.dietPreference"
        :date="today"
        @close="editorOpen = false"
        @saved="handleSaved"
      />
    </template>
    <div v-else class="mt-3 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
      <p class="font-semibold text-ink">Set up your profile to get meal ideas.</p>
      <p class="mt-1 text-xs leading-relaxed">Add your details or custom calories to see a personalized plan for your day.</p>
      <NuxtLink to="/profile" class="btn-soft mt-3 inline-flex min-h-11">Set up profile</NuxtLink>
    </div>
  </section>
</template>
