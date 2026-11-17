<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import { formatNumber, todayKey } from '~/utils/date'

const { state, resetAll } = useAppState()
const { user } = useAuth()

const joinedLabel = computed(() => {
  const createdAt = user.value?.createdAt
  if (!createdAt) return ''
  const normalized = createdAt.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
})

const resetNotice = ref(false)
const settingsOpen = ref(false)
const settingsNotice = ref(false)

const hasCustomMacros = computed(
  () =>
    state.value.profile.calorieMode === 'custom' &&
    (state.value.profile.customProtein > 0 ||
      state.value.profile.customCarbs > 0 ||
      state.value.profile.customFat > 0),
)

const calorieModeLabel = computed(() => {
  if (state.value.profile.calorieMode !== 'custom') return 'Recommended calories'
  return hasCustomMacros.value ? 'Custom calories & macros' : 'Custom calories'
})

function handleSettingsSaved(): void {
  settingsNotice.value = true
  window.setTimeout(() => {
    settingsNotice.value = false
  }, 2600)
}

const today = todayKey()
const current = computed(() => computePhase(today, state.value.cycle))
const targets = computed(() =>
  calculateTargets(state.value.profile, current.value.ready ? current.value.phase : null),
)

function resetData(): void {
  if (!window.confirm('Reset local CycleFuel preferences? Your account and saved diary entries will stay.')) return
  const foods = state.value.foods
  resetAll()
  state.value.foods = foods
  resetNotice.value = true
  window.setTimeout(() => {
    resetNotice.value = false
  }, 2600)
}
</script>

<template>
  <div class="animate-fade-up">
    <header class="flex items-start justify-between gap-3 pt-2">
      <div>
        <p class="eyebrow">Profile</p>
        <h1 class="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-ink">
          Made for you
        </h1>
        <p class="mt-1 text-sm text-ink-soft">Your details shape your estimates. You can change them any time.</p>
      </div>
      <button type="button" class="btn-soft mt-1 shrink-0" @click="settingsOpen = true">
        <AppIcon name="settings" :size="14" /> Settings
      </button>
    </header>

    <p v-if="settingsNotice" class="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-lavender-600">
      <AppIcon name="check" :size="13" /> Settings updated.
    </p>

    <section class="card mt-5">
      <div class="flex items-center gap-3">
        <span class="icon-bubble bg-plum-100 text-plum-600">
          <AppIcon name="user" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Account</p>
          <h2 class="section-title">Signed in as</h2>
        </div>
      </div>

      <div class="mt-4 space-y-2 text-xs">
        <div class="flex items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="text-ink-soft">Email</span>
          <span class="truncate font-semibold text-ink">{{ user?.email ?? '—' }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="text-ink-soft">Joined</span>
          <span class="font-semibold text-ink">{{ joinedLabel || '—' }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="text-ink-soft">Daily target</span>
          <span class="font-semibold text-ink">{{ formatNumber(targets.target) }} kcal</span>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap gap-1.5">
        <span class="chip">{{ targets.macros.protein }} g protein</span>
        <span class="chip">{{ targets.macros.carbs }} g carbs</span>
        <span class="chip">{{ targets.macros.fat }} g fat</span>
      </div>
    </section>

    <section class="card mt-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="eyebrow">Calorie calculator</p>
          <h2 class="section-title">Your daily estimate</h2>
          <button
            type="button"
            class="mt-1 text-[11px] font-semibold text-blush-600"
            @click="settingsOpen = true"
          >
            {{ calorieModeLabel }} · Change
          </button>
        </div>
        <PhaseBadge v-if="current.ready" :phase="current.phase" />
      </div>

      <div class="mt-4 flex items-center gap-4">
        <ProgressRing :progress="1" :size="104" :stroke="9" color="#EE6C90" color-end="#9A7CCB" track="#FFF0F4">
          <p class="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Target</p>
          <p class="font-display text-xl font-semibold leading-none text-ink">{{ formatNumber(targets.target) }}</p>
          <p class="mt-1 text-[9px] text-ink-soft">kcal</p>
        </ProgressRing>
        <div class="min-w-0 flex-1 space-y-2 text-xs">
          <div class="flex items-center justify-between rounded-xl bg-white/65 px-3 py-2">
            <span class="text-ink-soft">Base metabolism</span>
            <span class="font-semibold text-ink">{{ formatNumber(targets.bmr) }} kcal</span>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-white/65 px-3 py-2">
            <span class="text-ink-soft">With daily movement</span>
            <span class="font-semibold text-ink">{{ formatNumber(targets.tdee) }} kcal</span>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-white/65 px-3 py-2">
            <span class="text-ink-soft">Phase support</span>
            <span class="font-semibold text-ink">+{{ targets.phaseAdjustment }} kcal</span>
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2.5">
        <div class="rounded-2xl bg-white/70 px-3 py-2.5 text-center">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-plum-500">Protein</p>
          <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.protein }} g</p>
          <p class="text-[10px] text-ink-soft">{{ targets.split.protein }}%</p>
        </div>
        <div class="rounded-2xl bg-white/70 px-3 py-2.5 text-center">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-blush-500">Carbs</p>
          <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.carbs }} g</p>
          <p class="text-[10px] text-ink-soft">{{ targets.split.carbs }}%</p>
        </div>
        <div class="rounded-2xl bg-white/70 px-3 py-2.5 text-center">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-lavender-500">Fat</p>
          <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.fat }} g</p>
          <p class="text-[10px] text-ink-soft">{{ targets.split.fat }}%</p>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between rounded-2xl bg-lavender-50 px-3.5 py-2.5 text-xs">
        <span class="flex items-center gap-1.5 text-lavender-600">
          <AppIcon name="droplet" :size="14" /> Hydration target
        </span>
        <span class="font-semibold text-ink">{{ (targets.waterTarget / 1000).toFixed(1) }} L</span>
      </div>

      <p class="mt-3 text-[11px] leading-relaxed text-ink-soft">
        <template v-if="hasCustomMacros">
          You are using custom calorie and macro targets. Edit them any time in settings.
        </template>
        <template v-else-if="state.profile.calorieMode === 'custom'">
          You are using a custom daily target. Protein, carbs and fat are split using your cycle-phase ratios.
        </template>
        <template v-else>
          Calculated with the Mifflin–St Jeor equation and adjusted for your estimated cycle phase.
        </template>
        These are supportive estimates, not a prescription. No weight-loss pressure here.
      </p>
    </section>

    <section class="card mt-4">
      <div class="flex items-center gap-3">
        <span class="icon-bubble bg-lavender-100 text-lavender-600">
          <AppIcon name="cycle" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Cycle</p>
          <h2 class="section-title">
            {{ current.ready ? `Day ${current.cycleDay} of ${current.cycleLength}` : 'Not set up yet' }}
          </h2>
        </div>
        <NuxtLink to="/cycle" class="btn-soft shrink-0">
          {{ current.ready ? 'Edit' : 'Set up' }}
          <AppIcon name="arrow-right" :size="13" />
        </NuxtLink>
      </div>
      <p class="mt-2 text-xs leading-relaxed text-ink-soft">
        <template v-if="current.ready">
          Your cycle informs your daily targets, recommendations and reports. Change your period dates whenever
          you need.
        </template>
        <template v-else>
          Add your last period so CycleFuel can adapt its guidance to your phase.
        </template>
      </p>
    </section>

    <section class="card mt-4">
      <div class="flex items-center gap-3">
        <span class="icon-bubble bg-cream-200 text-plum-500">
          <AppIcon name="refresh" :size="18" />
        </span>
        <div>
          <p class="eyebrow">Your data</p>
          <h2 class="section-title">Local preferences</h2>
        </div>
      </div>
      <p class="mt-2 text-xs leading-relaxed text-ink-soft">
        Your food diary is saved to your account. Profile, cycle and water preferences stay in this browser's local
        storage.
      </p>
      <button type="button" class="btn-soft mt-3 text-blush-600" @click="resetData">
        <AppIcon name="trash" :size="13" /> Reset local preferences
      </button>
      <p v-if="resetNotice" class="mt-2 text-[11px] font-medium text-lavender-600">
        Local preferences have been reset.
      </p>
    </section>

    <ProfileSettingsModal
      :open="settingsOpen"
      @close="settingsOpen = false"
      @saved="handleSettingsSaved"
    />

    <p class="mt-5 px-2 text-center text-[10px] leading-relaxed text-ink-faint">
      CycleFuel is a wellbeing companion, not a medical device. For medical concerns, speak with a healthcare
      professional who knows you.
    </p>
  </div>
</template>
