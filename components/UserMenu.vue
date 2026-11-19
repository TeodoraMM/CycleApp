<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const props = withDefaults(defineProps<{ initial?: string }>(), {
  initial: '',
})

const { user, logout } = useAuth()
const route = useRoute()

const menuOpen = ref(false)
const loggingOut = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)

const displayInitial = computed(() => {
  if (!user.value) return ''
  return props.initial || user.value.email.charAt(0).toUpperCase()
})

function closeMenu(): void {
  menuOpen.value = false
}

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function handleDocumentClick(event: MouseEvent): void {
  if (!menuOpen.value) return
  const target = event.target as Node
  if (menuRef.value?.contains(target) || buttonRef.value?.contains(target)) return
  closeMenu()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !menuOpen.value) return
  closeMenu()
  buttonRef.value?.focus()
}

async function handleLogout(): Promise<void> {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await logout()
    closeMenu()
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
  }
}

watch(
  () => route.fullPath,
  () => closeMenu(),
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative">
    <NuxtLink
      v-if="!user"
      to="/login"
      class="flex h-11 w-11 items-center justify-center rounded-full border border-white/90 bg-white/80 text-sm font-semibold text-plum-600 shadow-sm transition hover:bg-white"
      aria-label="Log in"
    >
      <AppIcon name="user" :size="18" />
    </NuxtLink>

    <button
      v-else
      ref="buttonRef"
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full border border-white/90 bg-white/80 text-sm font-semibold text-plum-600 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400"
      :class="menuOpen ? 'ring-2 ring-blush-200' : ''"
      aria-label="Open account menu"
      aria-haspopup="menu"
      aria-controls="user-menu"
      :aria-expanded="menuOpen"
      @click="toggleMenu"
    >
      <span v-if="displayInitial">{{ displayInitial }}</span>
      <AppIcon v-else name="user" :size="18" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="origin-top-right -translate-y-1 scale-95 opacity-0"
      enter-to-class="origin-top-right translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="origin-top-right translate-y-0 scale-100 opacity-100"
      leave-to-class="origin-top-right -translate-y-1 scale-95 opacity-0"
    >
      <div
        v-if="menuOpen && user"
        id="user-menu"
        ref="menuRef"
        class="absolute right-0 top-full z-40 mt-2 max-h-[min(70vh,24rem)] w-[min(16rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] origin-top-right overflow-y-auto overscroll-contain rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-lg backdrop-blur-xl"
        role="menu"
        aria-label="Account menu"
        aria-orientation="vertical"
      >
        <div class="px-3 pb-2 pt-2.5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-plum-600">Signed in</p>
          <p class="mt-0.5 truncate text-sm font-semibold text-ink">{{ user.email }}</p>
        </div>

        <div class="mx-2 h-px bg-plum-100" />

        <div class="mt-1.5 space-y-0.5">
          <NuxtLink
            to="/profile"
            role="menuitem"
            class="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-blush-50 hover:text-plum-600 focus-visible:bg-blush-50 focus-visible:text-plum-600"
            @click="closeMenu"
          >
            <AppIcon name="user" :size="16" />
            Profile
          </NuxtLink>

          <button
            type="button"
            role="menuitem"
            class="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition hover:bg-blush-50 hover:text-blush-600 focus-visible:bg-blush-50 focus-visible:text-blush-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            <AppIcon name="logout" :size="16" />
            {{ loggingOut ? 'Logging out…' : 'Logout' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
