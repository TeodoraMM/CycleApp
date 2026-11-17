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

function dotClassFor(key: string): string {
  const meta = metaFor(key)
  if (!meta?.ready || meta.isLoggedPeriod || meta.isPredictedPeriod) return ''
  return PHASE_META[meta.phase].dotClass
}

function dayClasses(key: string): string {
  const meta = metaFor(key)
  const classes: string[] = []

  if (meta?.isLoggedPeriod) classes.push('bg-blush-100 font-bold text-blush-700')
  if (meta?.isPredictedPeriod) classes.push('bg-blush-50 text-blush-600 ring-1 ring-blush-200')
  if (meta?.isFertile && !meta.isLoggedPeriod && !meta.isPredictedPeriod && props.selected !== key) {
    classes.push('bg-plum-50/80')
  }
  if (!meta?.isLoggedPeriod && !meta?.isPredictedPeriod && props.selected !== key) {
    classes.push('text-ink hover:bg-white/80')
  }

  if (props.selected === key) {
    classes.push('bg-white text-ink shadow-soft ring-2 ring-plum-300')
  } else if (meta?.isPeriodStart) {
    classes.push('ring-2 ring-blush-400')
  } else if (meta?.isOvulation) {
    classes.push('ring-2 ring-plum-300')
  } else if (key === today) {
    classes.push('ring-1 ring-blush-300')
  }

  return classes.join(' ')
}
</script>

<template>
  <section class="card">
    <div class="flex items-center justify-between">
      <button type="button" class="btn-icon" aria-label="Previous month" @click="emit('shift', -1)">
        <AppIcon name="chevron-left" :size="16" />
      </button>
      <div class="text-center">
        <p class="eyebrow">Cycle calendar</p>
        <h2 class="font-display text-lg font-semibold text-ink">{{ title }}</h2>
      </div>
      <button type="button" class="btn-icon" aria-label="Next month" @click="emit('shift', 1)">
        <AppIcon name="chevron-right" :size="16" />
      </button>
    </div>

    <div class="mt-4 grid grid-cols-7 gap-y-1 text-center">
      <span
        v-for="(day, index) in weekdays"
        :key="`${day}-${index}`"
        class="pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint"
      >
        {{ day }}
      </span>
      <template v-for="cell in cells" :key="cell.key">
        <span v-if="!cell.current" class="h-10" />
        <button
          v-else
          type="button"
          class="relative mx-auto flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold transition duration-200"
          :class="dayClasses(cell.key)"
          :aria-label="`Select ${cell.key}`"
          :aria-pressed="selected === cell.key"
          @click="emit('select', cell.key)"
        >
          {{ cell.day }}
          <span
            v-if="dotClassFor(cell.key)"
            class="absolute bottom-1.5 h-1 w-1 rounded-full"
            :class="dotClassFor(cell.key)"
          />
        </button>
      </template>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
      <span class="flex items-center gap-1.5 text-[10px] text-ink-soft">
        <span class="h-2.5 w-2.5 rounded-md bg-blush-100 ring-1 ring-blush-400" /> Logged period
      </span>
      <span class="flex items-center gap-1.5 text-[10px] text-ink-soft">
        <span class="h-2.5 w-2.5 rounded-md bg-plum-50/80 ring-1 ring-plum-200" /> Fertile window
      </span>
      <template v-if="predictionsOn">
        <span class="flex items-center gap-1.5 text-[10px] text-ink-soft">
          <span class="h-2.5 w-2.5 rounded-md bg-blush-50 ring-1 ring-blush-200" /> Predicted period
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-ink-soft">
          <span class="h-2.5 w-2.5 rounded-md ring-2 ring-plum-300" /> Ovulation
        </span>
        <span v-for="phase in PHASE_LIST" :key="phase" class="flex items-center gap-1.5 text-[10px] text-ink-soft">
          <span class="h-1.5 w-1.5 rounded-full" :class="PHASE_META[phase].dotClass" />
          {{ PHASE_META[phase].label }}
        </span>
      </template>
    </div>
  </section>
</template>
