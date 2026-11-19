<script setup lang="ts">
import type { Phase } from '~/types'
import { PHASE_LIST, PHASE_META } from '~/data/phases'
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import { buildReport } from '~/composables/useReports'
import { formatNumber, parseDateKey, todayKey, weekdayShort } from '~/utils/date'
import { hasNutritionData } from '~/utils/userState'

const { state } = useAppState()

const today = todayKey()
const tab = ref<'recommendations' | 'reports'>('recommendations')
const range = ref<7 | 30>(7)
const activePhase = ref<Phase | null>(null)

function openPhase(phase: Phase): void {
  activePhase.value = phase
}

function closePhase(): void {
  activePhase.value = null
}

const current = computed(() => computePhase(today, state.value.cycle))
const meta = computed(() => PHASE_META[current.value.phase])
const targetsReady = computed(() => hasNutritionData(state.value.profile))
const targets = computed(() =>
  calculateTargets(state.value.profile, current.value.ready ? current.value.phase : null),
)
const report = computed(() => buildReport(state.value, range.value, today))

const chartData = computed(() =>
  report.value.points.map((point, index) => ({
    label:
      range.value === 7
        ? weekdayShort(point.key)
        : index % 5 === 0 || index === report.value.points.length - 1
          ? String(parseDateKey(point.key).getDate())
          : '',
    value: point.calories,
    highlight: point.key === today,
  })),
)

const balanceCopy = computed(() => {
  const summary = report.value
  if (summary.foodDays === 0) {
    return 'Log a few meals and your patterns will appear here. No judgement, just gentle information.'
  }
  if (!targetsReady.value || summary.avgTarget <= 0) {
    return 'You are building your record. Set up your profile to see how your days compare with personal estimates.'
  }
  if (Math.abs(summary.calorieDelta) <= summary.avgTarget * 0.1) {
    return 'You are fuelling close to your estimated needs. Steady and supportive — a lovely place to be.'
  }
  if (summary.calorieDelta < 0) {
    return 'Some days looked lighter than your estimate. That is okay. Regular nourishment can help your energy feel steadier.'
  }
  return 'A fuller range of food is completely normal, especially in the luteal phase. Food is information, not a grade.'
})

function setRange(value: 7 | 30): void {
  range.value = value
}

const macroTiles = computed(() => [
  { label: 'Protein', grams: targets.value.macros.protein, percent: targets.value.split.protein, accent: 'bg-plum-100 text-plum-600' },
  { label: 'Carbs', grams: targets.value.macros.carbs, percent: targets.value.split.carbs, accent: 'bg-blush-100 text-blush-600' },
  { label: 'Fat', grams: targets.value.macros.fat, percent: targets.value.split.fat, accent: 'bg-lavender-100 text-lavender-600' },
])
</script>

<template>
  <div class="min-w-0 animate-fade-up">
    <header class="min-w-0 pt-2">
      <p class="eyebrow">Insights</p>
      <h1 class="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        Your patterns
      </h1>
      <p class="mt-1 text-sm text-ink-soft">Phase-aware guidance and gentle progress, all in one place.</p>
    </header>

    <div class="mt-5 flex min-w-0 flex-col gap-2 rounded-full bg-white/70 p-1 shadow-sm sm:flex-row sm:gap-1">
      <button
        type="button"
        class="min-h-11 w-full min-w-0 rounded-full px-3 py-2.5 text-xs font-semibold transition sm:flex-1 sm:px-4"
        :class="tab === 'recommendations' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
        @click="tab = 'recommendations'"
      >
        Recommendations
      </button>
      <button
        type="button"
        class="min-h-11 w-full min-w-0 rounded-full px-3 py-2.5 text-xs font-semibold transition sm:flex-1 sm:px-4"
        :class="tab === 'reports' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
        @click="tab = 'reports'"
      >
        Reports
      </button>
    </div>

    <template v-if="tab === 'recommendations'">
      <section
        class="mt-4 min-w-0 overflow-hidden rounded-[30px] border border-white/80 p-4 shadow-soft sm:p-5"
        :style="{ background: `linear-gradient(135deg, ${meta.soft} 0%, #FFFFFF 62%, ${meta.soft} 100%)` }"
      >
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <PhaseBadge :phase="current.phase" />
            <h2 class="mt-2 font-display text-xl font-semibold leading-tight text-ink">{{ meta.tagline }}</h2>
            <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ meta.description }}</p>
          </div>
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80" :class="meta.textClass">
            <AppIcon name="sparkles" :size="20" />
          </span>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="nutrient in meta.nutrients" :key="nutrient" class="chip">{{ nutrient }}</span>
        </div>
        <NuxtLink v-if="!current.ready" to="/cycle" class="btn-primary mt-4 min-h-11 w-full">
          Set up your cycle
          <AppIcon name="arrow-right" :size="15" class="shrink-0" />
        </NuxtLink>
      </section>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">Macro balance</p>
            <h2 class="section-title">Your phase split</h2>
          </div>
          <span v-if="targetsReady" class="chip shrink-0">{{ formatNumber(targets.target) }} kcal</span>
        </div>

        <template v-if="targetsReady">
          <div class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div v-for="tile in macroTiles" :key="tile.label" class="min-w-0 rounded-2xl bg-white/70 px-3 py-3 text-center">
              <span class="mx-auto flex h-8 w-8 items-center justify-center rounded-xl" :class="tile.accent">
                <AppIcon name="chart" :size="14" />
              </span>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{{ tile.label }}</p>
              <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ tile.percent }}%</p>
              <p class="text-xs text-ink-soft">{{ tile.grams }} g</p>
            </div>
          </div>

          <div class="mt-4 min-w-0">
            <div class="flex h-3 overflow-hidden rounded-full bg-white/70">
              <div class="h-full bg-plum-400" :style="{ width: `${targets.split.protein}%` }" />
              <div class="h-full bg-blush-400" :style="{ width: `${targets.split.carbs}%` }" />
              <div class="h-full bg-lavender-400" :style="{ width: `${targets.split.fat}%` }" />
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-plum-400" />
                Protein {{ targets.split.protein }}%
              </span>
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-blush-400" />
                Carbs {{ targets.split.carbs }}%
              </span>
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-400" />
                Fat {{ targets.split.fat }}%
              </span>
            </div>
          </div>
          <p class="mt-3 text-xs leading-relaxed text-ink-soft">
            Protein supports repair, carbs support energy, and fats support hormones. All three belong.
          </p>
        </template>
        <div v-else class="mt-3 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
          <p class="font-semibold text-ink">Set up your profile to see your targets.</p>
          <p class="mt-1 text-xs leading-relaxed">Add your details or custom calories to get a personal macro split for your phase.</p>
          <NuxtLink to="/profile" class="btn-soft mt-3 inline-flex min-h-11">Set up profile</NuxtLink>
        </div>
      </section>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 items-center gap-3">
          <span class="icon-bubble" :class="meta.badgeClass">
            <AppIcon name="bowl" :size="18" />
          </span>
          <div class="min-w-0">
            <p class="eyebrow">On your plate</p>
            <h2 class="section-title leading-snug">Foods that may feel good</h2>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="food in meta.foods" :key="food" class="chip">{{ food }}</span>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-ink-soft">{{ meta.tip }}</p>
      </section>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 items-center gap-3">
          <span class="icon-bubble bg-lavender-100 text-lavender-600">
            <AppIcon name="heart" :size="18" />
          </span>
          <div class="min-w-0">
            <p class="eyebrow">Supportive habits</p>
            <h2 class="section-title leading-snug">Small, kind actions</h2>
          </div>
        </div>
        <ul class="mt-3 space-y-2">
          <li v-for="habit in meta.habits" :key="habit" class="flex min-w-0 items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blush-100 text-blush-700">
              <AppIcon name="check" :size="10" />
            </span>
            <span class="min-w-0 break-words">{{ habit }}</span>
          </li>
        </ul>
      </section>

      <section class="mt-6 min-w-0">
        <h2 class="font-display text-lg font-semibold text-ink">Explore every phase</h2>
        <div class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            v-for="phaseKey in PHASE_LIST"
            :key="phaseKey"
            type="button"
            class="min-h-11 min-w-0 break-words rounded-[24px] border border-white/80 bg-white/75 p-4 text-left shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
            :aria-label="`Explore ${PHASE_META[phaseKey].label} phase`"
            @click="openPhase(phaseKey)"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-full" :class="PHASE_META[phaseKey].dotClass" />
              <p class="min-w-0 truncate text-xs font-semibold text-ink">{{ PHASE_META[phaseKey].label }}</p>
              <span v-if="current.phase === phaseKey" class="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wider text-blush-700">
                Now
              </span>
            </div>
            <p class="mt-1.5 text-xs leading-relaxed text-ink-soft">{{ PHASE_META[phaseKey].tagline }}</p>
            <div class="mt-2 flex min-w-0 items-center justify-between gap-2">
              <p class="min-w-0 break-words text-xs leading-relaxed text-ink-soft">
                {{ PHASE_META[phaseKey].foods.slice(0, 3).join(' · ') }}
              </p>
              <AppIcon name="arrow-right" :size="12" class="shrink-0 text-plum-600" />
            </div>
          </button>
        </div>
      </section>

      <p class="mt-5 px-2 text-center text-xs leading-relaxed text-ink-soft">
        Recommendations are general wellbeing guidance, not medical or dietary prescriptions.
      </p>
    </template>

    <template v-else>
      <div class="mt-4 flex min-w-0 flex-col gap-2 rounded-full bg-white/60 p-1 sm:flex-row sm:gap-1">
        <button
          type="button"
          class="min-h-11 w-full min-w-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-1 sm:px-4"
          :class="range === 7 ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
          @click="setRange(7)"
        >
          This week
        </button>
        <button
          type="button"
          class="min-h-11 w-full min-w-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-1 sm:px-4"
          :class="range === 30 ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
          @click="setRange(30)"
        >
          This month
        </button>
      </div>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 items-start gap-3">
          <span class="icon-bubble bg-blush-100 text-blush-600">
            <AppIcon name="heart" :size="18" />
          </span>
          <div class="min-w-0">
            <p class="eyebrow">How it's going</p>
            <h2 class="section-title">A gentle summary</h2>
            <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ balanceCopy }}</p>
          </div>
        </div>
      </section>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          class="min-w-0 [&>p:nth-of-type(odd)]:text-xs"
          label="Avg calories"
          :value="`${formatNumber(report.avgCalories)} kcal`"
          :hint="targetsReady && report.avgTarget ? `vs ${formatNumber(report.avgTarget)} estimate` : 'Set up profile for estimates'"
          icon="flame"
          accent-class="bg-blush-100 text-blush-600"
        />
        <StatTile
          class="min-w-0 [&>p:nth-of-type(odd)]:text-xs"
          label="Avg protein"
          :value="`${Math.round(report.avgProtein)} g`"
          hint="repair & steadiness"
          icon="bolt"
          accent-class="bg-plum-100 text-plum-600"
        />
        <StatTile
          class="min-w-0 [&>p:nth-of-type(odd)]:text-xs"
          label="Avg water"
          :value="report.avgWater ? `${(report.avgWater / 1000).toFixed(1)} L` : '—'"
          :hint="report.waterTarget ? `of ${(report.waterTarget / 1000).toFixed(1)} L target` : 'Set up profile for estimate'"
          icon="droplet"
          accent-class="bg-lavender-100 text-lavender-600"
        />
        <StatTile
          class="min-w-0 [&>p:nth-of-type(odd)]:text-xs"
          label="Days logged"
          :value="`${report.foodDays} / ${report.days}`"
          :hint="`${report.consistency}% consistency`"
          icon="calendar"
          accent-class="bg-peach-100 text-peach-600"
        />
      </div>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">Energy pattern</p>
            <h2 class="section-title">Calories logged</h2>
          </div>
          <span class="chip shrink-0">{{ range === 7 ? '7 days' : '30 days' }}</span>
        </div>
        <div class="mt-4 min-w-0">
          <BarChart
            class="min-w-0 [&_.h-36_p]:text-[11px] [&_.mt-2_p]:text-[11px]"
            :data="chartData"
            :target="report.avgTarget"
            :show-values="range === 7"
            color-class="bg-lavender-300"
            highlight-class="bg-blush-400"
          />
        </div>
        <p class="mt-3 text-xs leading-relaxed text-ink-soft">
          The dashed line is your average estimate. Days are not pass or fail — they are simply information.
        </p>
      </section>

      <section class="card mt-4 min-w-0">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="eyebrow">Weekly balance</p>
            <h2 class="section-title">Average macros</h2>
          </div>
          <span class="chip shrink-0">{{ report.foodDays }} food days</span>
        </div>
        <template v-if="targetsReady">
          <div class="mt-4 space-y-3.5">
            <MacroBar
              label="Protein"
              :value="report.avgProtein"
              :target="targets.macros.protein"
              bar-class="bg-gradient-to-r from-plum-300 to-plum-500"
            />
            <MacroBar
              label="Carbs"
              :value="report.avgCarbs"
              :target="targets.macros.carbs"
              bar-class="bg-gradient-to-r from-blush-300 to-blush-500"
            />
            <MacroBar
              label="Fat"
              :value="report.avgFat"
              :target="targets.macros.fat"
              bar-class="bg-gradient-to-r from-lavender-300 to-lavender-500"
            />
          </div>
          <p class="mt-3 text-xs leading-relaxed text-ink-soft">
            Targets shown are your current phase estimates. Each day's needs shift with your cycle.
          </p>
        </template>
        <div v-else class="mt-3 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
          <p class="font-semibold text-ink">Set up your profile to compare macros.</p>
          <p class="mt-1 text-xs leading-relaxed">Once you have targets, you can see how your averages line up over time.</p>
          <NuxtLink to="/profile" class="btn-soft mt-3 inline-flex min-h-11">Set up profile</NuxtLink>
        </div>
      </section>

      <section class="mt-4 min-w-0 rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-soft sm:p-5">
        <div class="flex min-w-0 items-center gap-2 text-lavender-600">
          <AppIcon name="info" :size="15" class="shrink-0" />
          <p class="text-xs font-semibold uppercase tracking-[0.14em]">A kind reminder</p>
        </div>
        <p class="mt-2 text-sm leading-relaxed text-ink-soft">
          Progress here is about awareness, not restriction. Your body changes with your cycle, your seasons,
          and your life. This app will never push weight loss or a perfect streak.
        </p>
      </section>
    </template>

    <PhaseDetailModal :phase="activePhase" @close="closePhase" />
  </div>
</template>
