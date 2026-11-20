<script setup lang="ts">
const links = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/diary', label: 'Diary', icon: 'book' },
  { to: '/cycle', label: 'Cycle', icon: 'cycle' },
  { to: '/insights', label: 'Insights', icon: 'chart' },
]
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] pt-2 sm:pt-0"
    aria-label="Primary"
  >
    <div
      class="mx-auto w-[calc(100%-1.5rem)] max-w-md rounded-[26px] border border-white/70 bg-white/90 p-1.5 shadow-lift backdrop-blur-xl sm:mb-3"
    >
      <ul class="grid grid-cols-4">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            :aria-current="$route.path === link.to ? 'page' : undefined"
            class="flex min-h-[3.25rem] select-none flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 py-1 text-[11px] font-semibold transition duration-200 sm:text-xs"
            :class="
              $route.path === link.to
                ? 'bg-blush-100 text-blush-700'
                : 'text-ink-soft hover:bg-white/80'
            "
          >
            <AppIcon :name="link.icon" :size="20" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
