<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    icon?: string
    tone?: 'blush' | 'lavender' | 'peach' | 'plum'
  }>(),
  {
    tone: 'blush',
  },
)

const toneClass = computed(() => {
  switch (props.tone) {
    case 'lavender':
      return 'bg-lavender-100 text-lavender-600'
    case 'peach':
      return 'bg-peach-100 text-peach-600'
    case 'plum':
      return 'bg-plum-100 text-plum-600'
    default:
      return 'bg-blush-100 text-blush-600'
  }
})
</script>

<template>
  <div class="card-tight flex items-start gap-3">
    <div v-if="icon" class="icon-bubble mt-0.5 shrink-0" :class="toneClass">
      <AppIcon :name="icon" :size="18" />
    </div>
    <div class="min-w-0">
      <p class="eyebrow truncate">{{ label }}</p>
      <p class="mt-1 font-display text-2xl font-semibold leading-none text-ink sm:text-3xl">{{ value }}</p>
      <p v-if="hint" class="mt-1.5 text-xs leading-snug text-ink-soft">{{ hint }}</p>
    </div>
  </div>
</template>
