<script setup lang="ts">
import type { Phase } from '~/types'
import { PHASE_DETAILS, PHASE_META } from '~/data/phases'
import { useModalAccessibility } from '~/composables/useModalAccessibility'

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

useModalAccessibility(computed(() => props.phase !== null), close)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="phase && meta && detail" class="modal-backdrop" @click.self="close">
        <section
          class="animate-fade-up modal-panel bg-cream"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phase-detail-title"
        >
          <div
            class="modal-header flex-col items-stretch justify-start"
            :style="{ background: `linear-gradient(135deg, ${meta.soft} 0%, #FFFFFF 72%)` }"
          >
            <div class="flex items-start justify-between gap-3">
              <PhaseBadge :phase="phase" />
              <button type="button" class="btn-icon shrink-0" aria-label="Close phase details" @click="close">
                <AppIcon name="x" :size="16" />
              </button>
            </div>
            <h2 id="phase-detail-title" class="mt-3 font-display text-2xl font-semibold leading-tight text-ink">
              {{ meta.label }} phase
            </h2>
            <p class="mt-0.5 text-sm font-medium" :class="meta.textClass">{{ detail.timing }}</p>
            <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ meta.description }}</p>
          </div>

          <div class="modal-body space-y-3">
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
                  <AppIcon name="check" :size="13" class="mt-0.5 shrink-0 text-plum-600" />
                  {{ workout }}
                </li>
              </ul>
            </div>

            <div class="rounded-2xl px-4 py-3" :class="meta.badgeClass">
              <p class="text-sm font-semibold">{{ detail.takeaway }}</p>
            </div>
          </div>

          <div class="modal-footer items-center">
            <p class="text-center text-[11px] leading-relaxed text-ink-soft">General guidance, not medical advice.</p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
