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
    <div class="flex items-center justify-between gap-2">
      <p class="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft sm:text-[11px] sm:tracking-[0.14em]">{{ label }}</p>
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-7 sm:w-7" :class="accentClass">
        <AppIcon :name="icon" :size="14" />
      </span>
    </div>
    <p class="mt-2 break-words font-display text-lg font-semibold text-ink sm:text-xl">{{ value }}</p>
    <p v-if="hint" class="mt-0.5 text-[11px] leading-snug text-ink-soft">{{ hint }}</p>
  </div>
</template>
