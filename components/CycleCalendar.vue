<script setup lang="ts">
import type { CycleSettings, Phase } from '~/types'
import { PHASE_LIST, PHASE_META } from '~/data/phases'
import { isLoggedPeriodDay } from '~/utils/cycle'
import { formatMonthLabel, parseDateKey, toDateKey, todayKey } from '~/utils/date'
import { computePhase } from '~/composables/useCycle'

const props = defineProps<{
  month: string
  selected: string
  cycle: CycleSettings
}>()

const emit = defineEmits<{
  select: [key: string]
  shift: [delta: number]
}>()

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const today = todayKey()
const title = computed(() => formatMonthLabel(props.month))
const predictionsOn = computed(() => props.cycle.predictionsEnabled)

const cells = computed(() => {
  const first = parseDateKey(props.month)
  const year = first.getFullYear()
  const month = first.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const list: Array<{ key: string; day: number; current: boolean }> = []

  for (let index = 0; index < leading; index += 1) {
    list.push({ key: `lead-${index}`, day: 0, current: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    list.push({ key: toDateKey(new Date(year, month, day)), day, current: true })
  }
  while (list.length % 7 !== 0) {
    list.push({ key: `tail-${list.length}`, day: 0, current: false })
  }
  return list
})

interface DayMeta {
  phase: Phase
  ready: boolean
  isPeriodStart: boolean
  isLoggedPeriod: boolean
  isPredictedPeriod: boolean
  isFertile: boolean
  isOvulation: boolean
}

const metaCache = computed(() => {
  const map = new Map<string, DayMeta>()
  for (const cell of cells.value) {
    if (!cell.current) continue
    const info = computePhase(cell.key, props.cycle)
    const logged = isLoggedPeriodDay(props.cycle.entries, cell.key)
    map.set(cell.key, {
      phase: info.phase,
      ready: info.ready,
      isPeriodStart: props.cycle.entries.some((entry) => entry.start === cell.key),
      isLoggedPeriod: logged,
      isPredictedPeriod: predictionsOn.value && !logged && info.ready && info.isPeriodDay,
      isFertile:
        predictionsOn.value &&
        info.ready &&
        cell.key >= info.fertileWindowStart &&
        cell.key <= info.fertileWindowEnd,
      isOvulation: predictionsOn.value && info.ready && cell.key === info.ovulationDate,
    })
  }
  return map
})

function metaFor(key: string): DayMeta | undefined {
  return metaCache.value.get(key)
}

const PHASE_DAY_CLASS: Record<Phase, string> = {
  menstrual: 'bg-blush-100/90 text-blush-700',
  follicular: 'bg-lavender-100/90 text-lavender-700',
  ovulation: 'bg-peach-100/90 text-peach-600',
  luteal: 'bg-plum-100/90 text-plum-700',
}

function dayClasses(key: string): string {
  const meta = metaFor(key)
  const selected = props.selected === key
  const isToday = key === today

  if (selected) {
    const classes = [
      'z-10 border-2 border-blush-300 bg-plum-600 font-semibold text-white shadow-lift ring-2 ring-white/80 ring-offset-1 ring-offset-cream',
    ]
    if (isToday) classes.push('outline outline-2 outline-offset-2 outline-plum-500')
    return classes.join(' ')
  }

  if (isToday) {
    const classes = [
      'relative z-[1] border-2 border-plum-500 bg-white font-semibold text-plum-700 shadow-soft hover:bg-plum-50/40',
    ]
    if (meta?.isLoggedPeriod) classes.push('ring-2 ring-inset ring-blush-400')
    else if (meta?.isPredictedPeriod) classes.push('ring-2 ring-inset ring-dashed ring-blush-400')
    else if (meta?.isOvulation) classes.push('ring-2 ring-inset ring-peach-400')
    return classes.join(' ')
  }

  const classes: string[] = []

  if (meta?.ready) {
    classes.push(PHASE_DAY_CLASS[meta.phase])
  } else {
    classes.push('bg-white/70 text-ink')
  }

  if (meta?.isFertile && !meta.isLoggedPeriod && !meta.isPredictedPeriod) {
    classes.push('ring-1 ring-inset ring-peach-200')
  }

  if (meta?.isLoggedPeriod) {
    classes.push('bg-blush-200 text-blush-800 font-semibold ring-1 ring-inset ring-blush-300')
  } else if (meta?.isPredictedPeriod) {
    classes.push('bg-blush-50 text-blush-700 ring-1 ring-inset ring-dashed ring-blush-400')
  }

  if (meta?.isPeriodStart) {
    classes.push('ring-2 ring-inset ring-blush-500')
  } else if (meta?.isOvulation) {
    classes.push('ring-2 ring-inset ring-peach-400')
  }

  classes.push('hover:brightness-95')
  return classes.join(' ')
}
</script>

<template>
  <section class="card px-1 py-4 sm:px-5 sm:py-5">
    <div class="flex items-center justify-between gap-2 px-1 sm:px-0">
      <button type="button" class="btn-icon shrink-0" aria-label="Previous month" @click="emit('shift', -1)">
        <AppIcon name="chevron-left" :size="16" />
      </button>
      <div class="min-w-0 text-center">
        <p class="eyebrow">Cycle calendar</p>
        <h2 class="truncate font-display text-base font-semibold text-ink sm:text-lg">{{ title }}</h2>
      </div>
      <button type="button" class="btn-icon shrink-0" aria-label="Next month" @click="emit('shift', 1)">
        <AppIcon name="chevron-right" :size="16" />
      </button>
    </div>

    <div class="mt-4 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
      <span
        v-for="(day, index) in weekdays"
        :key="`${day}-${index}`"
        class="pb-1 text-[10px] font-semibold uppercase tracking-normal text-ink-soft sm:text-[11px] sm:tracking-wider"
      >
        {{ day }}
      </span>
      <template v-for="cell in cells" :key="cell.key">
        <span v-if="!cell.current" class="h-11 sm:h-12" />
        <button
          v-else
          type="button"
          class="relative mx-auto flex h-11 w-full min-w-0 items-center justify-center rounded-2xl text-xs font-semibold transition duration-200 sm:h-12 sm:text-sm"
          :class="dayClasses(cell.key)"
          :aria-label="`Select ${cell.key}`"
          :aria-pressed="selected === cell.key"
          @click="emit('select', cell.key)"
        >
          {{ cell.day }}
        </button>
      </template>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] text-ink-soft">
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md border-2 border-plum-500 bg-white" /> Today
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md bg-blush-100/90 ring-1 ring-blush-300" /> Menstrual
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md bg-lavender-100/90 ring-1 ring-lavender-300" /> Follicular
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md bg-peach-100/90 ring-1 ring-peach-300" /> Ovulation
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md bg-plum-100/90 ring-1 ring-plum-300" /> Luteal
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded-md bg-blush-200 ring-1 ring-blush-400" /> Logged period
      </span>
      <template v-if="predictionsOn">
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-md bg-blush-50 ring-1 ring-dashed ring-blush-400" /> Predicted period
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-md bg-white ring-2 ring-peach-400" /> Ovulation day
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-md bg-white ring-1 ring-inset ring-peach-200" /> Fertile window
        </span>
      </template>
    </div>
  </section>
</template>
