<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const { user, logout } = useAuth()

const mobileOpen = ref(false)

const activeSection = computed(() => {
  const section = route.query.section
  if (section === 'users' || section === 'audit') return section
  return 'overview'
})

const title = computed(() => {
  if (activeSection.value === 'users') return 'Users'
  if (activeSection.value === 'audit') return 'Audit log'
  return 'Overview'
})

async function handleLogout() {
  await logout()
  await navigateTo('/')
}

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-[100dvh] bg-cream">
    <div class="lg:grid lg:min-h-[100dvh] lg:grid-cols-[260px_1fr]">
      <div class="hidden border-r border-white/70 bg-white/50 backdrop-blur-sm lg:block">
        <div class="sticky top-0 h-[100dvh]">
          <AdminSidebar :active="activeSection" />
        </div>
      </div>

      <div class="min-w-0">
        <header class="sticky top-0 z-30 border-b border-white/70 bg-cream/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div class="flex items-center justify-between gap-3 px-3 py-3 sm:px-6">
            <div class="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                class="btn-icon lg:hidden"
                aria-label="Open navigation"
                @click="mobileOpen = true"
              >
                <AppIcon name="settings" :size="18" />
              </button>
              <div class="min-w-0">
                <p class="eyebrow">Admin dashboard</p>
                <h1 class="truncate font-display text-lg font-semibold text-ink sm:text-xl">{{ title }}</h1>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2 sm:gap-3">
              <span class="hidden max-w-[220px] truncate text-xs font-medium text-ink-soft sm:block">
                {{ user?.email }}
              </span>
              <button type="button" class="btn-soft" @click="handleLogout">
                <AppIcon name="logout" :size="16" />
                <span class="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main class="px-3 py-4 sm:px-6 sm:py-6">
          <slot />
        </main>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="mobileOpen" class="fixed inset-0 z-40 lg:hidden">
          <div class="absolute inset-0 bg-plum-700/40 backdrop-blur-sm" @click="mobileOpen = false" />
          <div class="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-white/70 bg-cream/98 shadow-lift">
            <div class="flex items-center justify-end px-3 pt-[calc(env(safe-area-inset-top)_+_0.75rem)]">
              <button type="button" class="btn-icon" aria-label="Close navigation" @click="mobileOpen = false">
                <AppIcon name="x" :size="18" />
              </button>
            </div>
            <AdminSidebar :active="activeSection" @navigate="mobileOpen = false" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
