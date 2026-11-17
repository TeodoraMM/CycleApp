<script setup lang="ts">
export interface ChartPoint {
  label: string
  value: number
  highlight?: boolean
}

const props = withDefaults(
  defineProps<{
    data: ChartPoint[]
    target?: number
    colorClass?: string
    highlightClass?: string
    unit?: string
    showValues?: boolean
  }>(),
  {
    target: 0,
    colorClass: 'bg-lavender-300',
    highlightClass: 'bg-blush-400',
    unit: 'kcal',
    showValues: false,
  },
)

const max = computed(() => {
  const values = props.data.map((point) => point.value)
  return Math.max(1, ...values, props.target)
})

const targetBottom = computed(() => (props.target > 0 ? Math.min(100, (props.target / max.value) * 100) : 0))

function heightPercent(value: number): number {
  if (value <= 0) return 0
  return Math.max(4, Math.min(100, (value / max.value) * 100))
}
</script>

<template>
  <div>
    <div class="relative h-36">
      <div
        v-if="target > 0"
        class="absolute inset-x-0 z-10 border-t border-dashed border-plum-300/70"
        :style="{ bottom: `${targetBottom}%` }"
      >
        <span class="absolute -top-4 right-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-plum-400">
          target
        </span>
      </div>
      <div class="flex h-full items-end gap-1.5">
        <div v-for="(point, index) in data" :key="`${point.label}-${index}`" class="flex h-full flex-1 flex-col justify-end">
          <p v-if="showValues && point.value > 0" class="mb-1 text-center text-[9px] font-semibold text-ink-soft">
            {{ Math.round(point.value) }}
          </p>
          <div
            class="w-full rounded-t-lg transition-all duration-700 ease-out"
            :class="point.highlight ? highlightClass : colorClass"
            :style="{ height: `${heightPercent(point.value)}%` }"
            :title="`${point.label}: ${Math.round(point.value)} ${unit}`"
          />
        </div>
      </div>
    </div>
    <div class="mt-2 flex gap-1.5">
      <p
        v-for="(point, index) in data"
        :key="`label-${index}`"
        class="flex-1 truncate text-center text-[9px] font-medium text-ink-faint"
      >
        {{ point.label }}
      </p>
    </div>
  </div>
</template>
