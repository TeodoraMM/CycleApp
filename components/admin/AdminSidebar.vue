<script setup lang="ts">
const props = defineProps<{
  active: string
}>()

defineEmits<{
  navigate: []
}>()

const links = [
  { key: 'overview', label: 'Overview', icon: 'chart', to: '/admin-teodora?section=overview' },
  { key: 'users', label: 'Users', icon: 'user', to: '/admin-teodora?section=users' },
  { key: 'audit', label: 'Audit log', icon: 'clock', to: '/admin-teodora?section=audit' },
]
</script>

<template>
  <aside class="flex h-full flex-col">
    <div class="px-4 pb-4 pt-5 sm:px-5">
      <NuxtLink to="/admin-teodora" class="flex items-center gap-2.5" @click="$emit('navigate')">
        <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-500 to-plum-500 text-white shadow-glow">
          <AppIcon name="leaf" :size="20" />
        </span>
        <span class="leading-none">
          <span class="block font-display text-lg font-semibold text-ink">CycleFuel</span>
          <span class="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-plum-600">Admin</span>
        </span>
      </NuxtLink>
    </div>

    <nav class="flex-1 space-y-1 px-3 sm:px-4" aria-label="Admin sections">
      <NuxtLink
        v-for="link in links"
        :key="link.key"
        :to="link.to"
        class="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition"
        :class="
          active === link.key
            ? 'bg-gradient-to-r from-blush-100 to-lavender-100 text-plum-700 shadow-sm'
            : 'text-ink-soft hover:bg-white/70 hover:text-plum-700'
        "
        @click="$emit('navigate')"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl"
          :class="active === link.key ? 'bg-white/80 text-plum-600' : 'bg-cream-100 text-ink-faint'"
        >
          <AppIcon :name="link.icon" :size="18" />
        </span>
        <span>{{ link.label }}</span>
      </NuxtLink>
    </nav>

    <div class="mt-auto px-4 pb-5 pt-4 sm:px-5">
      <div class="rounded-2xl border border-white/70 bg-cream-100/70 px-3 py-3">
        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-plum-600">Private admin area</p>
        <p class="mt-1 text-xs leading-snug text-ink-soft">Authorized access only. Actions may be audited.</p>
      </div>
    </div>
  </aside>
</template>
