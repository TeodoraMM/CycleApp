<script setup lang="ts">
defineProps<{
  toast: { type: 'success' | 'error'; message: string } | null
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="toast"
        class="fixed left-1/2 top-[calc(env(safe-area-inset-top)_+_1rem)] z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        role="status"
        aria-live="polite"
      >
        <div
          class="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift backdrop-blur-sm"
          :class="
            toast.type === 'success'
              ? 'border-lavender-200 bg-white/95 text-plum-700'
              : 'border-blush-200 bg-white/95 text-blush-700'
          "
        >
          <span
            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            :class="toast.type === 'success' ? 'bg-lavender-100 text-lavender-600' : 'bg-blush-100 text-blush-600'"
          >
            <AppIcon :name="toast.type === 'success' ? 'check' : 'info'" :size="16" />
          </span>
          <p class="min-w-0 text-sm font-medium leading-snug">{{ toast.message }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
