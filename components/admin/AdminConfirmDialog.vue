<script setup lang="ts">
import { useModalAccessibility } from '~/composables/useModalAccessibility'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    destructive?: boolean
  }>(),
  {
    confirmLabel: 'Confirm',
    destructive: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const openRef = toRef(props, 'open')

function onCancel() {
  emit('cancel')
}

useModalAccessibility(openRef, onCancel)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-backdrop" @click.self="onCancel">
        <div class="modal-panel sm:max-w-md" role="dialog" aria-modal="true" :aria-label="title">
          <div class="modal-header">
            <div>
              <p class="eyebrow">{{ destructive ? 'Confirm action' : 'Please confirm' }}</p>
              <h2 class="section-title mt-1">{{ title }}</h2>
            </div>
            <button type="button" class="btn-icon" aria-label="Close dialog" @click="onCancel">
              <AppIcon name="x" :size="18" />
            </button>
          </div>
          <div class="modal-body">
            <p class="text-sm leading-relaxed text-ink-soft">{{ message }}</p>
          </div>
          <div class="modal-footer sm:justify-end">
            <button type="button" class="btn-soft" @click="onCancel">Cancel</button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-soft transition duration-200 hover:brightness-105 active:scale-[0.99] sm:min-h-0"
              :class="destructive ? 'bg-blush-700' : 'bg-gradient-to-r from-blush-700 to-plum-600'"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
