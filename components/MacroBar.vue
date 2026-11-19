<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    value: number
    target: number
    unit?: string
    barClass?: string
    trackClass?: string
  }>(),
  {
    unit: 'g',
    barClass: 'bg-gradient-to-r from-blush-400 to-plum-400',
    trackClass: 'bg-white/80',
  },
)

const percent = computed(() =>
  props.target > 0 ? Math.min(100, Math.max(0, (props.value / props.target) * 100)) : 0,
)
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-2 text-[11px] sm:text-xs">
      <span class="min-w-0 truncate font-medium text-ink">{{ label }}</span>
      <span class="shrink-0 whitespace-nowrap text-ink-soft">
        {{ Math.round(value) }}<span class="text-ink-soft"> / {{ Math.round(target) }}{{ unit }}</span>
      </span>
    </div>
    <div class="mt-1.5 h-2.5 overflow-hidden rounded-full sm:h-2" :class="trackClass">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :class="barClass"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
