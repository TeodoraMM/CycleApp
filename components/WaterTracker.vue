<script setup lang="ts">
const props = defineProps<{
  consumed: number
  target: number
}>()

const emit = defineEmits<{
  add: [amount: number]
}>()

const percent = computed(() =>
  props.target > 0 ? Math.min(100, Math.round((props.consumed / props.target) * 100)) : 0,
)
const glasses = computed(() => Math.round(props.consumed / 250))
const label = computed(() => {
  if (percent.value >= 100) return 'Beautifully hydrated'
  if (percent.value >= 60) return 'Nicely on your way'
  if (percent.value > 0) return 'A gentle start'
  return 'A sip to begin'
})
</script>

<template>
  <section class="card">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="icon-bubble bg-lavender-100 text-lavender-600">
          <AppIcon name="droplet" :size="18" />
        </span>
        <div>
          <p class="eyebrow">Hydration</p>
          <h2 class="section-title">Water</h2>
        </div>
      </div>
      <span class="chip">{{ glasses }} glasses</span>
    </div>

    <div class="mt-4 flex items-end justify-between gap-3">
      <div>
        <p class="font-display text-2xl font-semibold text-ink">
          {{ (consumed / 1000).toFixed(consumed % 1000 === 0 ? 0 : 1) }}<span class="text-sm text-ink-soft"> L</span>
        </p>
        <p class="text-xs text-ink-soft">of {{ (target / 1000).toFixed(1) }} L · {{ label }}</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="btn-soft" aria-label="Remove 250 millilitres" @click="emit('add', -250)">
          <AppIcon name="minus" :size="14" />
        </button>
        <button type="button" class="btn-soft" @click="emit('add', 250)">
          <AppIcon name="plus" :size="14" /> 250 ml
        </button>
      </div>
    </div>

    <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-lavender-100">
      <div
        class="h-full rounded-full bg-gradient-to-r from-lavender-300 to-lavender-500 transition-all duration-700 ease-out"
        :style="{ width: `${percent}%` }"
      />
    </div>

    <div class="mt-3 flex items-center justify-between">
      <div class="flex -space-x-1.5">
        <span
          v-for="glass in 8"
          :key="glass"
          class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white"
          :class="glass <= Math.min(8, Math.round(percent / 12.5)) ? 'bg-lavender-400 text-white' : 'bg-lavender-50 text-lavender-300'"
        >
          <AppIcon name="droplet" :size="10" />
        </span>
      </div>
      <button type="button" class="text-[11px] font-semibold text-lavender-600" @click="emit('add', 500)">
        + 500 ml
      </button>
    </div>
  </section>
</template>
