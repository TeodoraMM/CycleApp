<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { PHASE_META } from '~/data/phases'
import { buildCycleHistory, isLoggedPeriodDay, isPeriodStartDate, MIN_CYCLE_GAP_DAYS } from '~/utils/cycle'
import { formatLong, formatShort, monthStart, shiftMonth, todayKey } from '~/utils/date'

const { state, logPeriod } = useAppState()

const today = todayKey()
const cursor = ref(monthStart(today))
const selected = ref(today)
const feedback = ref('')
const warning = ref('')
let feedbackTimer: number | undefined

const phase = computed(() => computePhase(selected.value, state.value.cycle))
const phaseMeta = computed(() => PHASE_META[phase.value.phase])
const isStartDate = computed(() => isPeriodStartDate(state.value.cycle.entries, selected.value))
const isLoggedDay = computed(() => isLoggedPeriodDay(state.value.cycle.entries, selected.value))
const predictionsOn = computed(() => state.value.cycle.predictionsEnabled)
const isFuture = computed(() => selected.value > today)
const history = computed(() => buildCycleHistory(state.value.cycle.entries))

const actionLabel = computed(() => {
  if (isStartDate.value) return 'Remove Period Start'
  return selected.value === today ? 'Period Started Today' : 'Log Period Start'
})

const actionClass = computed(() =>
  isStartDate.value
    ? 'inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blush-200 bg-white/80 px-5 py-3 text-sm font-semibold text-blush-600 shadow-sm transition hover:bg-white disabled:opacity-60'
    : 'btn-primary w-full',
)

const statusText = computed(() => {
  if (isStartDate.value) return 'This date is logged as the start of a period.'
  if (isLoggedDay.value) return 'This day falls within a logged period.'
  if (!phase.value.ready) return 'No period logged yet. Choose a past day and log a start to begin.'
  if (phase.value.isPeriodDay) {
    return predictionsOn.value
      ? `Predicted period day · cycle day ${phase.value.cycleDay}.`
      : `Cycle day ${phase.value.cycleDay}. Predictions are turned off.`
  }
  return `${phaseMeta.value.label.toLowerCase()} phase · cycle day ${phase.value.cycleDay}.`
})

function setNotice(message: string, isWarning: boolean): void {
  if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer)
  warning.value = isWarning ? message : ''
  feedback.value = isWarning ? '' : message
  if (message) {
    feedbackTimer = window.setTimeout(() => {
      feedback.value = ''
      warning.value = ''
      feedbackTimer = undefined
    }, 4000)
  }
}

function selectDay(key: string): void {
  selected.value = key
  if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer)
  feedback.value = ''
  warning.value = ''
}

function moveMonth(delta: number): void {
  cursor.value = shiftMonth(cursor.value, delta)
}

function togglePeriodStart(): void {
  if (isFuture.value) return
  const result = logPeriod(selected.value)
  setNotice(result.message, result.status === 'rejected')
  if (result.status !== 'rejected') cursor.value = monthStart(selected.value)
}

onBeforeUnmount(() => {
  if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer)
})
</script>

<template>
  <div class="animate-fade-up">
    <header class="pt-2">
      <p class="eyebrow">Cycle</p>
      <h1 class="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
        Your rhythm
      </h1>
      <p class="mt-1 text-sm text-ink-soft">
        Log period starts, see predictions and review your cycles in one place.
      </p>
    </header>

    <div class="mt-4">
      <CycleCalendar
        :month="cursor"
        :selected="selected"
        :cycle="state.cycle"
        @select="selectDay"
        @shift="moveMonth"
      />
    </div>

    <section class="card mt-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="eyebrow">Selected day</p>
          <h2 class="section-title mt-1">{{ formatLong(selected) }}</h2>
        </div>
        <PhaseBadge v-if="phase.ready" :phase="phase.phase" />
        <span v-else class="chip">No phase yet</span>
      </div>

      <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ statusText }}</p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <span v-if="isStartDate" class="chip-accent bg-blush-100 text-blush-700">
          <AppIcon name="droplet" :size="12" /> Period start
        </span>
        <span v-else-if="isLoggedDay" class="chip-accent bg-blush-50 text-blush-600">
          Logged period day
        </span>
        <span
          v-else-if="phase.ready && phase.isPeriodDay && predictionsOn"
          class="chip-accent bg-blush-50 text-blush-600"
        >
          Predicted period
        </span>
        <span v-if="phase.ready" class="chip">Cycle day {{ phase.cycleDay }}</span>
        <span v-if="!predictionsOn" class="chip">Predictions off</span>
      </div>

      <button type="button" :class="actionClass" :disabled="isFuture" @click="togglePeriodStart">
        <AppIcon :name="isStartDate ? 'x' : 'droplet'" :size="15" />
        {{ actionLabel }}
      </button>

      <p
        v-if="warning"
        role="alert"
        class="mt-2 text-center text-[11px] font-medium leading-relaxed text-blush-600"
      >
        {{ warning }}
      </p>
      <p
        v-else-if="feedback"
        class="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-lavender-600"
      >
        <AppIcon name="check" :size="13" /> {{ feedback }}
      </p>
      <p v-else-if="isFuture" class="mt-2 text-center text-[10px] text-ink-soft">
        Periods can only be logged on or before today.
      </p>
      <p v-else class="mt-2 text-center text-[10px] leading-relaxed text-ink-soft">
        Logging a start fills in {{ state.cycle.periodLength }} period days and refreshes every prediction.
      </p>
    </section>

    <section class="card mt-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="eyebrow">History</p>
          <h2 class="section-title">Your cycles</h2>
        </div>
        <span class="chip">{{ history.length }} {{ history.length === 1 ? 'cycle' : 'cycles' }}</span>
      </div>

      <div v-if="history.length" class="mt-4 overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr class="border-b border-plum-100 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              <th class="pb-2 pr-2 font-semibold">Start</th>
              <th class="pb-2 pr-2 font-semibold">Last day</th>
              <th class="pb-2 pr-2 font-semibold">Duration</th>
              <th class="pb-2 text-right font-semibold">Cycle length</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-plum-100/70">
            <tr v-for="row in history" :key="row.start" class="text-ink">
              <td class="py-2.5 pr-2 font-semibold">{{ formatShort(row.start) }}</td>
              <td class="py-2.5 pr-2 text-ink-soft">{{ formatShort(row.end) }}</td>
              <td class="py-2.5 pr-2 text-ink-soft">{{ row.duration }} days</td>
              <td class="py-2.5 text-right font-semibold">
                {{ row.cycleLength === null ? '—' : `${row.cycleLength} days` }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="mt-3 text-[10px] leading-relaxed text-ink-soft">
          Cycle length runs from one period start to the next. Starts closer than
          {{ MIN_CYCLE_GAP_DAYS }} days are treated as one cycle.
        </p>
      </div>
      <p v-else class="mt-3 text-sm leading-relaxed text-ink-soft">
        No periods logged yet. Select a day on the calendar and log a period start to create your first entry.
      </p>
    </section>
  </div>
</template>
