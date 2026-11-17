<script setup lang="ts">
import type { Phase } from '~/types'
import { PHASE_META } from '~/data/phases'

const props = withDefaults(defineProps<{ phase: Phase; size?: 'sm' | 'md' }>(), {
  size: 'sm',
})

const meta = computed(() => PHASE_META[props.phase])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full font-semibold"
    :class="[
      meta.badgeClass,
      size === 'sm' ? 'px-2.5 py-1 text-[10px] uppercase tracking-wider' : 'px-3 py-1.5 text-xs',
    ]"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="meta.dotClass" />
    {{ meta.label }} phase
  </span>
</template>
