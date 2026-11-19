<script setup lang="ts">
import { useId } from 'vue'

const props = withDefaults(
  defineProps<{
    progress: number
    size?: number
    stroke?: number
    color?: string
    colorEnd?: string
    track?: string
    rounded?: boolean
  }>(),
  {
    size: 120,
    stroke: 10,
    color: '#EE6C90',
    colorEnd: '',
    track: '#F3E8EC',
    rounded: true,
  },
)

const gradientId = useId()
const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const clamped = computed(() => Math.min(1, Math.max(0, Number.isFinite(props.progress) ? props.progress : 0)))
const dash = computed(() => `${clamped.value * circumference.value} ${circumference.value}`)
const strokeColor = computed(() => (props.colorEnd ? `url(#${gradientId})` : props.color))
</script>

<template>
  <div
    class="relative inline-flex aspect-square max-w-full shrink-0 items-center justify-center"
    :style="{ width: `min(${size}px, 100%)` }"
    role="progressbar"
    :aria-valuenow="Math.round(clamped * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <svg :viewBox="`0 0 ${size} ${size}`" class="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
      <defs v-if="colorEnd">
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="color" />
          <stop offset="100%" :stop-color="colorEnd" />
        </linearGradient>
      </defs>
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="track"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="strokeColor"
        :stroke-width="stroke"
        :stroke-linecap="rounded ? 'round' : 'butt'"
        :stroke-dasharray="dash"
        class="transition-all duration-700 ease-out"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
      <slot />
    </div>
  </div>
</template>
