<script setup lang="ts">
import type { Phase } from '~/types'
import { PHASE_LIST, PHASE_META } from '~/data/phases'
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import { buildReport } from '~/composables/useReports'
import { formatNumber, parseDateKey, todayKey, weekdayShort } from '~/utils/date'

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
  <div class="animate-fade-up">
    <header class="pt-2">
      <p class="eyebrow">Insights</p>
      <h1 class="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        Your patterns
      </h1>
      <p class="mt-1 text-sm text-ink-soft">Phase-aware guidance and gentle progress, all in one place.</p>
    </header>

    <div class="mt-5 flex gap-1 rounded-full bg-white/70 p-1 shadow-sm">
      <button
        type="button"
        class="flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition"
        :class="tab === 'recommendations' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
        @click="tab = 'recommendations'"
      >
        Recommendations
      </button>
      <button
        type="button"
        class="flex-1 rounded-full px-4 py-2.5 text-xs font-semibold transition"
        :class="tab === 'reports' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
        @click="tab = 'reports'"
      >
        Reports
      </button>
    </div>

    <template v-if="tab === 'recommendations'">
      <section
        class="mt-4 overflow-hidden rounded-[30px] border border-white/80 p-5 shadow-soft"
        :style="{ background: `linear-gradient(135deg, ${meta.soft} 0%, #FFFFFF 62%, ${meta.soft} 100%)` }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
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
        <NuxtLink v-if="!current.ready" to="/cycle" class="btn-primary mt-4 w-full">
          Set up your cycle
          <AppIcon name="arrow-right" :size="15" />
        </NuxtLink>
      </section>

      <section class="card mt-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="eyebrow">Macro balance</p>
            <h2 class="section-title">Your phase split</h2>
          </div>
          <span class="chip">{{ formatNumber(targets.target) }} kcal</span>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2.5">
          <div v-for="tile in macroTiles" :key="tile.label" class="rounded-2xl bg-white/70 px-3 py-3 text-center">
            <span class="mx-auto flex h-8 w-8 items-center justify-center rounded-xl" :class="tile.accent">
              <AppIcon name="chart" :size="14" />
            </span>
            <p class="mt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{{ tile.label }}</p>
            <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ tile.percent }}%</p>
            <p class="text-[10px] text-ink-soft">{{ tile.grams }} g</p>
          </div>
        </div>

        <div class="mt-4">
          <div class="flex h-3 overflow-hidden rounded-full bg-white/70">
            <div class="h-full bg-plum-400" :style="{ width: `${targets.split.protein}%` }" />
            <div class="h-full bg-blush-400" :style="{ width: `${targets.split.carbs}%` }" />
            <div class="h-full bg-lavender-400" :style="{ width: `${targets.split.fat}%` }" />
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-soft">
            <span class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-plum-400" />
              Protein {{ targets.split.protein }}%
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-blush-400" />
              Carbs {{ targets.split.carbs }}%
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-lavender-400" />
              Fat {{ targets.split.fat }}%
            </span>
          </div>
        </div>
        <p class="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Protein supports repair, carbs support energy, and fats support hormones. All three belong.
        </p>
      </section>

      <section class="card mt-4">
        <div class="flex items-center gap-3">
          <span class="icon-bubble" :class="meta.badgeClass">
            <AppIcon name="bowl" :size="18" />
          </span>
          <div>
            <p class="eyebrow">On your plate</p>
            <h2 class="section-title">Foods that may feel good</h2>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="food in meta.foods" :key="food" class="chip">{{ food }}</span>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-ink-soft">{{ meta.tip }}</p>
      </section>

      <section class="card mt-4">
        <div class="flex items-center gap-3">
          <span class="icon-bubble bg-lavender-100 text-lavender-600">
            <AppIcon name="heart" :size="18" />
          </span>
          <div>
            <p class="eyebrow">Supportive habits</p>
            <h2 class="section-title">Small, kind actions</h2>
          </div>
        </div>
        <ul class="mt-3 space-y-2">
          <li v-for="habit in meta.habits" :key="habit" class="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blush-100 text-blush-500">
              <AppIcon name="check" :size="10" />
            </span>
            {{ habit }}
          </li>
        </ul>
      </section>

      <section class="mt-6">
        <h2 class="font-display text-lg font-semibold text-ink">Explore every phase</h2>
        <div class="mt-3 grid grid-cols-2 gap-2.5">
          <button
            v-for="phaseKey in PHASE_LIST"
            :key="phaseKey"
            type="button"
            class="rounded-[24px] border border-white/80 bg-white/75 p-4 text-left shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
            :aria-label="`Explore ${PHASE_META[phaseKey].label} phase`"
            @click="openPhase(phaseKey)"
          >
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="PHASE_META[phaseKey].dotClass" />
              <p class="text-xs font-semibold text-ink">{{ PHASE_META[phaseKey].label }}</p>
              <span v-if="current.phase === phaseKey" class="ml-auto text-[8px] font-semibold uppercase tracking-wider text-blush-500">
                Now
              </span>
            </div>
            <p class="mt-1.5 text-[11px] leading-relaxed text-ink-soft">{{ PHASE_META[phaseKey].tagline }}</p>
            <div class="mt-2 flex items-center justify-between gap-2">
              <p class="text-[10px] leading-relaxed text-ink-faint">
                {{ PHASE_META[phaseKey].foods.slice(0, 3).join(' · ') }}
              </p>
              <AppIcon name="arrow-right" :size="12" class="shrink-0 text-plum-400" />
            </div>
          </button>
        </div>
      </section>

      <p class="mt-5 px-2 text-center text-[10px] leading-relaxed text-ink-faint">
        Recommendations are general wellbeing guidance, not medical or dietary prescriptions.
      </p>
    </template>

    <template v-else>
      <div class="mt-4 flex gap-1 rounded-full bg-white/60 p-1">
        <button
          type="button"
          class="flex-1 rounded-full px-4 py-2 text-xs font-semibold transition"
          :class="range === 7 ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
          @click="setRange(7)"
        >
          This week
        </button>
        <button
          type="button"
          class="flex-1 rounded-full px-4 py-2 text-xs font-semibold transition"
          :class="range === 30 ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
          @click="setRange(30)"
        >
          This month
        </button>
      </div>

      <section class="card mt-4">
        <div class="flex items-start gap-3">
          <span class="icon-bubble bg-blush-100 text-blush-600">
            <AppIcon name="heart" :size="18" />
          </span>
          <div>
            <p class="eyebrow">How it's going</p>
            <h2 class="section-title">A gentle summary</h2>
            <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ balanceCopy }}</p>
          </div>
        </div>
      </section>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          label="Avg calories"
          :value="`${formatNumber(report.avgCalories)} kcal`"
          :hint="`vs ${formatNumber(report.avgTarget)} estimate`"
          icon="flame"
          accent-class="bg-blush-100 text-blush-600"
        />
        <StatTile
          label="Avg protein"
          :value="`${Math.round(report.avgProtein)} g`"
          hint="repair & steadiness"
          icon="bolt"
          accent-class="bg-plum-100 text-plum-600"
        />
        <StatTile
          label="Avg water"
          :value="report.avgWater ? `${(report.avgWater / 1000).toFixed(1)} L` : '—'"
          :hint="`of ${(report.waterTarget / 1000).toFixed(1)} L target`"
          icon="droplet"
          accent-class="bg-lavender-100 text-lavender-600"
        />
        <StatTile
          label="Days logged"
          :value="`${report.foodDays} / ${report.days}`"
          :hint="`${report.consistency}% consistency`"
          icon="calendar"
          accent-class="bg-peach-100 text-peach-500"
        />
      </div>

      <section class="card mt-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="eyebrow">Energy pattern</p>
            <h2 class="section-title">Calories logged</h2>
          </div>
          <span class="chip">{{ range === 7 ? '7 days' : '30 days' }}</span>
        </div>
        <div class="mt-4">
          <BarChart
            :data="chartData"
            :target="report.avgTarget"
            :show-values="range === 7"
            color-class="bg-lavender-300"
            highlight-class="bg-blush-400"
          />
        </div>
        <p class="mt-3 text-[11px] leading-relaxed text-ink-soft">
          The dashed line is your average estimate. Days are not pass or fail — they are simply information.
        </p>
      </section>

      <section class="card mt-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="eyebrow">Weekly balance</p>
            <h2 class="section-title">Average macros</h2>
          </div>
          <span class="chip">{{ report.foodDays }} food days</span>
        </div>
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
        <p class="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Targets shown are your current phase estimates. Each day's needs shift with your cycle.
        </p>
      </section>

      <section class="mt-4 rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-soft">
        <div class="flex items-center gap-2 text-lavender-600">
          <AppIcon name="info" :size="15" />
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em]">A kind reminder</p>
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
