<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'

const { state } = useAppState()
const { user, initialize } = useAuth()

await initialize()

const initial = computed(() => {
  const name = state.value.profile.name.trim()
  if (name) return name.charAt(0).toUpperCase()
  return user.value?.email.charAt(0).toUpperCase() ?? ''
})
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-x-clip">
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        class="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blush-200/40 blur-3xl"
        style="animation: float 9s ease-in-out infinite"
      />
      <div
        class="absolute -right-28 top-40 h-72 w-72 rounded-full bg-lavender-200/40 blur-3xl"
        style="animation: float 11s ease-in-out infinite reverse"
      />
      <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cream-200/70 blur-3xl" />
    </div>

    <header class="sticky top-0 z-30 bg-cream/70 backdrop-blur-xl">
      <div class="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
        <NuxtLink to="/" class="flex items-center gap-2.5" aria-label="CycleFuel home">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 via-blush-500 to-plum-400 text-white shadow-glow"
          >
            <AppIcon name="leaf" :size="20" />
          </span>
          <span class="leading-none">
            <span class="block font-display text-lg font-semibold tracking-tight text-ink">CycleFuel</span>
            <span class="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-plum-400">
              Cycle-aware nourishment
            </span>
          </span>
        </NuxtLink>

        <UserMenu :initial="initial" />
      </div>
    </header>

    <main class="mx-auto w-full max-w-lg flex-1 px-5 pb-32 pt-1">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>
