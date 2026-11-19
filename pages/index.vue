<script setup lang="ts">
import type { MealType } from '~/types'
import { PHASE_META } from '~/data/phases'
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets, calculateTotals } from '~/composables/useNutrition'
import { formatLong, formatNumber, formatShort, todayKey } from '~/utils/date'
import { hasNutritionData } from '~/utils/userState'

const { state, addWater, logPeriod } = useAppState()

const today = todayKey()
const MEAL_META: Array<{ key: MealType; label: string; icon: string }> = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sun' },
  { key: 'lunch', label: 'Lunch', icon: 'bowl' },
  { key: 'dinner', label: 'Dinner', icon: 'moon' },
  { key: 'snack', label: 'Snacks', icon: 'sparkles' },
]

const phase = computed(() => computePhase(today, state.value.cycle))
const meta = computed(() => PHASE_META[phase.value.phase])
const targets = computed(() =>
  calculateTargets(state.value.profile, phase.value.ready ? phase.value.phase : null),
)
const targetsReady = computed(() => hasNutritionData(state.value.profile))
const entries = computed(() => state.value.foods.filter((entry) => entry.date === today))
const totals = computed(() => calculateTotals(entries.value))
const remaining = computed(() =>
  targetsReady.value ? Math.max(0, Math.round(targets.value.target - totals.value.calories)) : 0,
)
const overTarget = computed(() => targetsReady.value && totals.value.calories > targets.value.target)
const calorieProgress = computed(() =>
  targets.value.target > 0 ? totals.value.calories / targets.value.target : 0,
)
const log = computed(() => state.value.logs[today])
const water = computed(() => log.value?.waterMl ?? 0)
const firstName = computed(() => state.value.profile.name.trim().split(/\s+/)[0] ?? '')

const meals = computed(() =>
  MEAL_META.map((meal) => {
    const items = entries.value.filter((entry) => entry.meal === meal.key)
    return {
      ...meal,
      count: items.length,
      calories: items.reduce((sum, item) => sum + item.calories, 0),
    }
  }),
)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const nextPeriodCopy = computed(() => {
  if (!phase.value.ready) return 'Add your cycle to personalise your nutrition.'
  if (phase.value.daysUntilNextPeriod <= 1) return 'Your period is expected tomorrow.'
  if (phase.value.isPeriodDay) return `Day ${phase.value.cycleDay} of your period.`
  return `${phase.value.daysUntilNextPeriod} days until your next period.`
})

const setupDate = ref(today)

function saveSetup(): void {
  logPeriod(setupDate.value)
}
</script>

<template>
  <div class="min-w-0 animate-fade-up">
    <header class="min-w-0 pt-2">
      <p class="text-xs font-medium uppercase tracking-[0.16em] text-plum-600">{{ formatLong(today) }}</p>
      <h1 class="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {{ greeting }}<span v-if="firstName">, {{ firstName }}</span>
      </h1>
      <p class="mt-1 text-sm text-ink-soft">A gentle look at your day, shaped around your cycle.</p>
    </header>

    <section v-if="!phase.ready" class="card mt-5 min-w-0">
      <div class="flex min-w-0 items-start gap-3">
        <span class="icon-bubble bg-blush-100 text-blush-600">
          <AppIcon name="moon" :size="18" />
        </span>
        <div class="min-w-0">
          <p class="eyebrow">Let's begin</p>
          <h2 class="section-title">Tune into your cycle</h2>
          <p class="mt-1 text-sm leading-relaxed text-ink-soft">
            Add the first day of your last period and we'll gently estimate the phase you're in.
          </p>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div class="min-w-0">
          <label class="label" for="setup-date">First day of your last period</label>
          <input id="setup-date" v-model="setupDate" type="date" :max="today" class="input mt-1 w-full min-w-0" />
        </div>
        <p class="text-xs leading-relaxed text-ink-soft">
          We'll use your saved cycle settings and fill in the default period length for you.
        </p>
      </div>

      <button type="button" class="btn-primary mt-4 min-h-11 w-full" @click="saveSetup">
        Personalise my insights
        <AppIcon name="arrow-right" :size="16" class="shrink-0" />
      </button>
      <p class="mt-2 text-center text-xs leading-relaxed text-ink-soft">
        You can change this any time. Estimates only, never a diagnosis.
      </p>
    </section>

    <section
      v-else
      class="mt-5 min-w-0 overflow-hidden rounded-[30px] border border-white/80 p-4 shadow-soft sm:p-5"
      :style="{ background: `linear-gradient(135deg, ${meta.soft} 0%, #FFFFFF 62%, ${meta.soft} 100%)` }"
    >
      <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <ProgressRing
          class="self-center sm:self-auto"
          :progress="phase.cycleDay / phase.cycleLength"
          :size="106"
          :stroke="8"
          :color="meta.accent"
          color-end="#B49BDE"
          track="#FFFFFF"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">Day</p>
          <p class="font-display text-2xl font-semibold leading-none text-ink">{{ phase.cycleDay }}</p>
          <p class="mt-0.5 text-xs text-ink-soft">of {{ phase.cycleLength }}</p>
        </ProgressRing>

        <div class="min-w-0 flex-1">
          <PhaseBadge :phase="phase.phase" />
          <h2 class="mt-2 font-display text-xl font-semibold leading-tight text-ink">{{ meta.tagline }}</h2>
          <p class="mt-1 text-xs leading-relaxed text-ink-soft">{{ nextPeriodCopy }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-ink-soft">
            <span>{{ formatShort(phase.phaseStart) }} – {{ formatShort(phase.phaseEnd) }}</span>
            <span class="h-1 w-1 rounded-full bg-plum-300" />
            <span class="min-w-0 break-words">{{ meta.nutrients.slice(0, 2).join(' · ') }}</span>
          </div>
        </div>
      </div>

      <NuxtLink
        to="/cycle"
        class="mt-4 flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-2xl bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-plum-600 transition hover:bg-white"
      >
        <span class="min-w-0">View your cycle and phase guide</span>
        <AppIcon name="arrow-right" :size="14" class="shrink-0" />
      </NuxtLink>
    </section>

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="eyebrow">Energy</p>
          <h2 class="section-title">Today's fuel</h2>
        </div>
        <span class="chip max-w-full shrink-0 break-words">
          {{ targetsReady ? `${formatNumber(totals.calories)} / ${formatNumber(targets.target)} kcal` : `${formatNumber(totals.calories)} kcal logged` }}
        </span>
      </div>

      <template v-if="targetsReady">
        <div class="mt-5 flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center">
          <ProgressRing
            class="self-center sm:self-auto"
            :progress="calorieProgress"
            :size="138"
            :stroke="11"
            color="#EE6C90"
            color-end="#9A7CCB"
            track="#FFF0F4"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft sm:text-xs">
              {{ overTarget ? 'Over estimate' : 'Remaining' }}
            </p>
            <p class="font-display text-2xl font-semibold leading-none text-ink">
              {{ overTarget ? Math.round(totals.calories - targets.target) : remaining }}
            </p>
            <p class="mt-1 text-xs text-ink-soft">kcal</p>
          </ProgressRing>

          <div class="w-full min-w-0 space-y-3.5">
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

        <p class="mt-4 text-xs leading-relaxed text-ink-soft">
          Your target shifts gently with your phase. These are estimates to support you, never rules.
        </p>
      </template>
      <div v-else class="mt-4 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
        <p class="font-semibold text-ink">Set up your profile to get daily targets.</p>
        <p class="mt-1 text-xs leading-relaxed">Add your details or custom calories and we’ll estimate your energy and macro needs.</p>
        <NuxtLink to="/profile" class="btn-soft mt-3 inline-flex min-h-11">Go to profile</NuxtLink>
      </div>
    </section>

    <div class="mt-4 min-w-0">
      <WaterTracker
        class="[&>div]:min-w-0 [&>div]:flex-wrap [&>div]:gap-y-3 [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:whitespace-nowrap"
        :consumed="water"
        :target="targets.waterTarget"
        @add="(amount) => addWater(today, amount)"
      />
    </div>

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="eyebrow">Food diary</p>
          <h2 class="section-title">Today's meals</h2>
        </div>
        <NuxtLink to="/diary" class="btn-soft min-h-11 shrink-0">
          Open diary
          <AppIcon name="arrow-right" :size="13" class="shrink-0" />
        </NuxtLink>
      </div>

      <ul class="mt-3 divide-y divide-plum-100/60">
        <li v-for="meal in meals" :key="meal.key">
          <NuxtLink
            to="/diary"
            class="flex min-w-0 items-center gap-3 rounded-2xl px-1 py-3 transition hover:bg-white/60"
          >
            <span class="icon-bubble h-9 w-9 bg-cream-100 text-plum-600">
              <AppIcon :name="meal.icon" :size="16" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-ink">{{ meal.label }}</span>
              <span class="block text-xs text-ink-soft">
                {{ meal.count === 0 ? 'Nothing logged yet' : `${meal.count} item${meal.count > 1 ? 's' : ''}` }}
              </span>
            </span>
            <span class="shrink-0 whitespace-nowrap text-xs font-semibold text-ink">{{ meal.calories }} kcal</span>
            <AppIcon name="chevron-right" :size="14" class="shrink-0 text-ink-soft" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <MealPlanCard
      v-if="targetsReady"
      class="min-w-0 [&_button.btn-icon]:h-11 [&_button.btn-icon]:w-11 [&_li>div]:gap-2 [&_li>div>div]:min-w-0"
    />
    <section v-else class="card mt-4 min-w-0">
      <p class="eyebrow">Meal plan</p>
      <h2 class="section-title">Ideas for today</h2>
      <p class="mt-1.5 text-sm text-ink-soft">Set up your profile to get meal ideas tailored to your goals and calories.</p>
    </section>

    <section class="mt-4 min-w-0 rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-soft sm:p-5">
      <div class="flex min-w-0 items-center gap-2" :class="meta.textClass">
        <AppIcon name="sparkles" :size="15" class="shrink-0" />
        <p class="eyebrow" :class="meta.textClass">Nourish for your phase</p>
      </div>
      <h2 class="mt-2 font-display text-lg font-semibold leading-snug text-ink">{{ meta.focus[0] }}</h2>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ meta.tip }}</p>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span v-for="food in meta.foods.slice(0, 4)" :key="food" class="chip">{{ food }}</span>
      </div>
      <NuxtLink
        to="/insights"
        class="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold"
        :class="meta.textClass"
      >
        See your phase guide
        <AppIcon name="arrow-right" :size="13" class="shrink-0" />
      </NuxtLink>
    </section>

    <p class="mt-5 px-2 text-center text-xs leading-relaxed text-ink-soft">
      CycleFuel offers gentle wellbeing guidance, not medical advice. Listen to your body first.
    </p>
  </div>
</template>
