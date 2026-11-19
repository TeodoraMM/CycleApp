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
  <div class="relative flex min-h-[100dvh] flex-col overflow-x-clip">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(env(safe-area-inset-top)_+_0.75rem)] focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-plum-700 focus:shadow-lg"
    >
      Skip to content
    </a>

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

    <header class="sticky top-0 z-30 bg-cream/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div class="mx-auto flex max-w-lg items-center justify-between px-2 py-3 sm:px-5 sm:py-4">
        <NuxtLink to="/" class="flex min-h-11 items-center gap-2.5" aria-label="CycleFuel home">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 via-blush-500 to-plum-400 text-white shadow-glow"
          >
            <AppIcon name="leaf" :size="20" />
          </span>
          <span class="leading-none">
            <span class="block font-display text-lg font-semibold tracking-tight text-ink">CycleFuel</span>
            <span class="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-plum-600">
              Cycle-aware nourishment
            </span>
          </span>
        </NuxtLink>

        <UserMenu :initial="initial" />
      </div>
    </header>

    <main
      id="main-content"
      class="mx-auto w-full max-w-lg flex-1 px-2 pb-[calc(6.75rem_+_env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-32"
    >
      <slot />
    </main>

    <BottomNav />
  </div>
</template>
