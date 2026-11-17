import type { CycleSettings, Phase } from '~/types'
import { normalizeCycleEntries, normalizeCycleLength, normalizePeriodLength } from '~/utils/cycle'
import { addDaysToKey, daysBetween, parseDateKey } from '~/utils/date'

export interface PhaseInfo {
  ready: boolean
  phase: Phase
  cycleDay: number
  cycleLength: number
  periodLength: number
  ovulationDay: number
  ovulationDate: string
  fertileWindowStart: string
  fertileWindowEnd: string
  phaseStart: string
  phaseEnd: string
  cycleStart: string
  nextPeriodDate: string
  daysUntilNextPeriod: number
  isPeriodDay: boolean
}

const FALLBACK_PHASE: Phase = 'follicular'

function normalizeCycle(cycle: CycleSettings): { cycleLength: number; periodLength: number } {
  return {
    cycleLength: normalizeCycleLength(cycle.cycleLength),
    periodLength: normalizePeriodLength(cycle.periodLength),
  }
}

function phaseForDay(day: number, ovulationDay: number, periodLength: number): Phase {
  if (day <= periodLength) return 'menstrual'
  if (day >= ovulationDay - 1 && day <= ovulationDay + 1) return 'ovulation'
  if (day < ovulationDay - 1) return 'follicular'
  return 'luteal'
}

function phaseWindow(
  phase: Phase,
  cycleStart: string,
  cycleLength: number,
  periodLength: number,
  ovulationDay: number,
): { start: string; end: string } {
  switch (phase) {
    case 'menstrual':
      return { start: cycleStart, end: addDaysToKey(cycleStart, periodLength - 1) }
    case 'follicular':
      return {
        start: addDaysToKey(cycleStart, periodLength),
        end: addDaysToKey(cycleStart, Math.max(periodLength, ovulationDay - 2)),
      }
    case 'ovulation':
      return {
        start: addDaysToKey(cycleStart, ovulationDay - 1),
        end: addDaysToKey(cycleStart, ovulationDay + 1),
      }
    default:
      return {
        start: addDaysToKey(cycleStart, ovulationDay + 2),
        end: addDaysToKey(cycleStart, cycleLength - 1),
      }
  }
}

function emptyPhaseInfo(cycleLength: number, periodLength: number): PhaseInfo {
  return {
    ready: false,
    phase: FALLBACK_PHASE,
    cycleDay: 0,
    cycleLength,
    periodLength,
    ovulationDay: cycleLength - 14,
    ovulationDate: '',
    fertileWindowStart: '',
    fertileWindowEnd: '',
    phaseStart: '',
    phaseEnd: '',
    cycleStart: '',
    nextPeriodDate: '',
    daysUntilNextPeriod: 0,
    isPeriodDay: false,
  }
}

export function computePhase(dateKey: string, cycle: CycleSettings): PhaseInfo {
  const { cycleLength, periodLength } = normalizeCycle(cycle)
  const starts = normalizeCycleEntries(cycle.entries, periodLength).map((entry) => entry.start)

  if (starts.length === 0) return emptyPhaseInfo(cycleLength, periodLength)

  const target = parseDateKey(dateKey)
  const firstStart = starts[0]
  if (!firstStart || target < parseDateKey(firstStart)) {
    return emptyPhaseInfo(cycleLength, periodLength)
  }

  let anchor = firstStart
  for (const start of starts) {
    if (parseDateKey(start) <= target) anchor = start
  }

  const diff = daysBetween(parseDateKey(anchor), target)
  const cyclesElapsed = Math.floor(diff / cycleLength)
  const cycleStart = addDaysToKey(anchor, cyclesElapsed * cycleLength)
  const cycleDay = diff - cyclesElapsed * cycleLength + 1
  const ovulationDay = Math.min(
    Math.max(cycleLength - 14, periodLength + 2),
    Math.max(periodLength + 3, cycleLength - 7),
  )
  const phase = phaseForDay(cycleDay, ovulationDay, periodLength)
  const window = phaseWindow(phase, cycleStart, cycleLength, periodLength, ovulationDay)
  const nextPeriodDate = addDaysToKey(cycleStart, cycleLength)

  return {
    ready: true,
    phase,
    cycleDay,
    cycleLength,
    periodLength,
    ovulationDay,
    ovulationDate: addDaysToKey(cycleStart, ovulationDay - 1),
    fertileWindowStart: addDaysToKey(cycleStart, Math.max(periodLength, ovulationDay - 5)),
    fertileWindowEnd: addDaysToKey(cycleStart, ovulationDay + 1),
    phaseStart: window.start,
    phaseEnd: window.end,
    cycleStart,
    nextPeriodDate,
    daysUntilNextPeriod: Math.max(0, daysBetween(target, parseDateKey(nextPeriodDate))),
    isPeriodDay: cycleDay <= periodLength,
  }
}

export function cycleDayFor(dateKey: string, cycle: CycleSettings): number {
  return computePhase(dateKey, cycle).cycleDay
}
