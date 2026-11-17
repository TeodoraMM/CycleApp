<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    hint?: string
    icon?: string
    accentClass?: string
  }>(),
  {
    hint: '',
    icon: 'sparkles',
    accentClass: 'bg-blush-100 text-blush-600',
  },
)
</script>

<template>
  <div class="card-tight">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{{ label }}</p>
      <span class="flex h-7 w-7 items-center justify-center rounded-xl" :class="accentClass">
        <AppIcon :name="icon" :size="14" />
      </span>
    </div>
    <p class="mt-2 font-display text-xl font-semibold text-ink">{{ value }}</p>
    <p v-if="hint" class="mt-0.5 text-[11px] leading-snug text-ink-soft">{{ hint }}</p>
  </div>
</template>
