<script setup lang="ts">
const links = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/diary', label: 'Diary', icon: 'book' },
  { to: '/cycle', label: 'Cycle', icon: 'cycle' },
  { to: '/insights', label: 'Insights', icon: 'chart' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
    <div
      class="mx-auto mb-3 w-[calc(100%-1.75rem)] max-w-md rounded-[26px] border border-white/70 bg-white/85 p-1.5 shadow-lift backdrop-blur-xl"
    >
      <ul class="grid grid-cols-5">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="flex flex-col items-center gap-0.5 rounded-[20px] px-0.5 py-1.5 text-[9px] font-semibold transition duration-200"
            :class="
              $route.path === link.to
                ? 'bg-blush-100/90 text-blush-600'
                : 'text-ink-soft hover:bg-white/70'
            "
          >
            <AppIcon :name="link.icon" :size="19" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
