<script setup lang="ts">
import type { Phase } from '~/types'
import { PHASE_DETAILS, PHASE_META } from '~/data/phases'

const props = defineProps<{
  phase: Phase | null
}>()

const emit = defineEmits<{
  close: []
}>()

const meta = computed(() => (props.phase ? PHASE_META[props.phase] : null))
const detail = computed(() => (props.phase ? PHASE_DETAILS[props.phase] : null))

function close(): void {
  emit('close')
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.phase) close()
}

watch(
  () => props.phase,
  (phase) => {
    if (!import.meta.client) return
    document.body.style.overflow = phase ? 'hidden' : ''
    if (phase) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
)

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="phase && meta && detail"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-plum-700/35 p-4 backdrop-blur-sm"
        @click.self="close"
      >
        <section
          class="animate-fade-up flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-white/70 bg-cream shadow-lift"
          role="dialog"
          aria-modal="true"
          :aria-label="`${meta.label} phase details`"
        >
          <div
            class="px-5 pb-4 pt-5"
            :style="{ background: `linear-gradient(135deg, ${meta.soft} 0%, #FFFFFF 72%)` }"
          >
            <div class="flex items-start justify-between gap-3">
              <PhaseBadge :phase="phase" />
              <button type="button" class="btn-icon" aria-label="Close phase details" @click="close">
                <AppIcon name="x" :size="16" />
              </button>
            </div>
            <h2 class="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
              {{ meta.label }} phase
            </h2>
            <p class="mt-0.5 text-sm font-medium" :class="meta.textClass">{{ detail.timing }}</p>
            <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ meta.description }}</p>
          </div>

          <div class="flex-1 space-y-3 overflow-y-auto px-5 pb-5 pt-4">
            <div class="rounded-2xl bg-white/75 p-4">
              <div class="flex items-center gap-2" :class="meta.textClass">
                <AppIcon name="sparkles" :size="15" />
                <p class="eyebrow" :class="meta.textClass">Hormonal changes</p>
              </div>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ detail.hormones }}</p>
            </div>

            <div class="rounded-2xl bg-white/75 p-4">
              <div class="flex items-center gap-2" :class="meta.textClass">
                <AppIcon name="bolt" :size="15" />
                <p class="eyebrow" :class="meta.textClass">Energy &amp; mood</p>
              </div>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ detail.energy }}</p>
            </div>

            <div class="rounded-2xl bg-white/75 p-4">
              <div class="flex items-center gap-2" :class="meta.textClass">
                <AppIcon name="bowl" :size="15" />
                <p class="eyebrow" :class="meta.textClass">Nutrition focus</p>
              </div>
              <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">{{ detail.nutrition }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span v-for="food in meta.foods.slice(0, 5)" :key="food" class="chip text-[11px]">{{ food }}</span>
              </div>
              <p class="mt-2 text-[11px] leading-relaxed text-ink-soft">{{ meta.tip }}</p>
            </div>

            <div class="rounded-2xl bg-white/75 p-4">
              <div class="flex items-center gap-2" :class="meta.textClass">
                <AppIcon name="heart" :size="15" />
                <p class="eyebrow" :class="meta.textClass">Recommended movement</p>
              </div>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="workout in detail.workouts"
                  :key="workout"
                  class="flex items-start gap-2 text-sm leading-relaxed text-ink-soft"
                >
                  <AppIcon name="check" :size="13" class="mt-0.5 shrink-0 text-plum-400" />
                  {{ workout }}
                </li>
              </ul>
            </div>

            <div class="rounded-2xl px-4 py-3" :class="meta.badgeClass">
              <p class="text-sm font-semibold">{{ detail.takeaway }}</p>
            </div>
          </div>

          <div class="border-t border-plum-100 bg-white/70 px-5 py-3 text-center">
            <p class="text-[10px] leading-relaxed text-ink-faint">General guidance, not medical advice.</p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
