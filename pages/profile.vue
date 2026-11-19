<script setup lang="ts">
import { createDefaultState, useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import type { StoredUserState } from '~/types'
import { formatNumber, todayKey } from '~/utils/date'
import { hasNutritionData, isProfileConfigured } from '~/utils/userState'

const { state, resetAll } = useAppState()
const { user } = useAuth()

const profileReady = computed(() => isProfileConfigured(state.value.profile))
const targetsReady = computed(() => hasNutritionData(state.value.profile))

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

async function resetData(): Promise<void> {
  if (!window.confirm('Reset your profile, cycle, and water logs? Your account and saved diary entries will stay.')) return
  if (user.value) {
    try {
      const response = await $fetch<{ state: StoredUserState }>('/api/me/state', {
        method: 'PUT',
        body: { state: { profile: null, cycle: null, logs: {} } },
      })
      const defaults = createDefaultState()
      state.value = {
        ...defaults,
        profile: response.state.profile ? { ...defaults.profile, ...response.state.profile } : defaults.profile,
        cycle: response.state.cycle ? { ...defaults.cycle, ...response.state.cycle } : defaults.cycle,
        logs: response.state.logs ?? {},
        foods: state.value.foods,
      }
    } catch {
      return
    }
  } else {
    const foods = state.value.foods
    resetAll()
    state.value.foods = foods
  }
  resetNotice.value = true
  window.setTimeout(() => {
    resetNotice.value = false
  }, 2600)
}
</script>

<template>
  <div class="min-w-0 animate-fade-up">
    <header class="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <p class="eyebrow">Profile</p>
        <h1 class="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          Made for you
        </h1>
        <p class="mt-1 text-sm text-ink-soft">Your details shape your estimates. You can change them any time.</p>
      </div>
      <button type="button" class="btn-soft min-h-11 w-full shrink-0 sm:w-auto" @click="settingsOpen = true">
        <AppIcon name="settings" :size="14" class="shrink-0" /> Settings
      </button>
    </header>

    <p v-if="settingsNotice" class="mt-2 flex items-center gap-1.5 text-xs font-medium text-lavender-600">
      <AppIcon name="check" :size="13" class="shrink-0" /> Settings updated.
    </p>

    <section class="card mt-5 min-w-0">
      <div class="flex min-w-0 items-center gap-3">
        <span class="icon-bubble bg-plum-100 text-plum-600">
          <AppIcon name="user" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="eyebrow">Account</p>
          <h2 class="section-title">Signed in as</h2>
        </div>
      </div>

      <div class="mt-4 space-y-2 text-xs">
        <div class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="shrink-0 text-ink-soft">Email</span>
          <span class="min-w-0 truncate text-right font-semibold text-ink">{{ user?.email ?? '—' }}</span>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="shrink-0 text-ink-soft">Joined</span>
          <span class="min-w-0 text-right font-semibold text-ink">{{ joinedLabel || '—' }}</span>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
          <span class="shrink-0 text-ink-soft">Daily target</span>
          <span class="min-w-0 text-right font-semibold text-ink">
            {{ targetsReady ? `${formatNumber(targets.target)} kcal` : 'Not set yet' }}
          </span>
        </div>
      </div>

      <div v-if="targetsReady" class="mt-2 flex flex-wrap gap-1.5">
        <span class="chip">{{ targets.macros.protein }} g protein</span>
        <span class="chip">{{ targets.macros.carbs }} g carbs</span>
        <span class="chip">{{ targets.macros.fat }} g fat</span>
      </div>
      <div v-else class="mt-3 rounded-2xl bg-white/65 px-3.5 py-3 text-sm text-ink-soft">
        Add your age, height, weight, and goals to get your personal daily estimate.
        <button type="button" class="mt-2 min-h-11 text-xs font-semibold text-blush-600" @click="settingsOpen = true">
          Set up profile
        </button>
      </div>
    </section>

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="eyebrow">Calorie calculator</p>
          <h2 class="section-title">Your daily estimate</h2>
          <button
            type="button"
            class="mt-1 min-h-11 text-xs font-semibold text-blush-600"
            @click="settingsOpen = true"
          >
            {{ targetsReady ? `${calorieModeLabel} · Change` : 'Set up profile' }}
          </button>
        </div>
        <PhaseBadge v-if="current.ready" :phase="current.phase" class="shrink-0" />
      </div>

      <div v-if="targetsReady">
        <div class="mt-4 flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing
            class="self-center sm:self-auto"
            :progress="1"
            :size="104"
            :stroke="9"
            color="#EE6C90"
            color-end="#9A7CCB"
            track="#FFF0F4"
          >
            <p class="font-display text-xl font-semibold leading-none text-ink">{{ formatNumber(targets.target) }}</p>
            <p class="mt-0.5 text-xs text-ink-soft">kcal / day</p>
          </ProgressRing>

          <div class="w-full min-w-0 space-y-1.5 text-xs">
            <div v-if="targets.bmr" class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
              <span class="min-w-0 shrink text-ink-soft">BMR</span>
              <span class="min-w-0 text-right font-semibold text-ink">{{ formatNumber(targets.bmr) }} kcal</span>
            </div>
            <div v-if="targets.tdee" class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
              <span class="min-w-0 shrink text-ink-soft">TDEE</span>
              <span class="min-w-0 text-right font-semibold text-ink">{{ formatNumber(targets.tdee) }} kcal</span>
            </div>
            <div v-if="targets.phaseAdjustment" class="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2">
              <span class="min-w-0 shrink text-ink-soft">Phase adjustment</span>
              <span class="min-w-0 text-right font-semibold text-ink">+{{ targets.phaseAdjustment }} kcal</span>
            </div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <div class="min-w-0 rounded-2xl bg-plum-50/80 p-2.5 text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-plum-600">Protein</p>
            <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.protein }} g</p>
            <p class="text-xs text-ink-soft">{{ targets.split.protein }}%</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-blush-50/80 p-2.5 text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-blush-600">Carbs</p>
            <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.carbs }} g</p>
            <p class="text-xs text-ink-soft">{{ targets.split.carbs }}%</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-lavender-50/80 p-2.5 text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-lavender-600">Fat</p>
            <p class="mt-0.5 font-display text-lg font-semibold text-ink">{{ targets.macros.fat }} g</p>
            <p class="text-xs text-ink-soft">{{ targets.split.fat }}%</p>
          </div>
        </div>

        <div v-if="targets.waterTarget" class="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-lavender-50/70 px-3.5 py-2.5">
          <div class="flex min-w-0 items-center gap-2 text-lavender-600">
            <AppIcon name="droplet" :size="14" class="shrink-0" />
            <span class="min-w-0 text-xs font-medium">Daily hydration estimate</span>
          </div>
          <span class="min-w-0 font-semibold text-ink">{{ (targets.waterTarget / 1000).toFixed(1) }} L</span>
        </div>

        <p class="mt-3 text-xs leading-relaxed text-ink-soft">
          <template v-if="hasCustomMacros">
            You are using custom calorie and macro targets. Edit them any time in settings.
          </template>
          <template v-else-if="state.profile.calorieMode === 'custom'">
            You are using a custom calorie target. Macros follow your recommended phase split.
          </template>
          <template v-else>
            Calculated with the Mifflin–St Jeor equation, adjusted for your activity, goal and cycle phase.
          </template>
        </p>
      </div>
      <div v-else class="mt-4 rounded-2xl bg-white/65 px-3.5 py-4 text-sm text-ink-soft">
        <p>No daily estimate yet.</p>
        <p class="mt-1 text-xs">Enter your profile details or set custom calories to personalize your targets.</p>
      </div>
    </section>

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex min-w-0 items-center gap-3">
          <span class="icon-bubble bg-lavender-100 text-lavender-600">
            <AppIcon name="cycle" :size="18" />
          </span>
          <div class="min-w-0">
            <p class="eyebrow">Cycle</p>
            <h2 class="section-title leading-snug">
              {{ current.ready ? `Day ${current.cycleDay} of ${current.cycleLength}` : 'Not set up yet' }}
            </h2>
          </div>
        </div>
        <NuxtLink to="/cycle" class="btn-soft min-h-11 w-full shrink-0 sm:w-auto">
          {{ current.ready ? 'Edit' : 'Set up' }}
          <AppIcon name="arrow-right" :size="13" class="shrink-0" />
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

    <section class="card mt-4 min-w-0">
      <div class="flex min-w-0 items-center gap-3">
        <span class="icon-bubble bg-cream-200 text-plum-500">
          <AppIcon name="refresh" :size="18" />
        </span>
        <div class="min-w-0">
          <p class="eyebrow">Your data</p>
          <h2 class="section-title">Local preferences</h2>
        </div>
      </div>
      <p class="mt-2 text-xs leading-relaxed text-ink-soft">
        Your food diary stays saved to your account. This resets your profile, cycle settings, and water logs for a fresh start.
      </p>
      <button type="button" class="btn-soft mt-3 min-h-11 w-full text-blush-600 sm:w-auto" @click="resetData">
        <AppIcon name="trash" :size="13" class="shrink-0" /> Reset profile and cycle
      </button>
      <p v-if="resetNotice" class="mt-2 text-xs font-medium text-lavender-600">
        Your profile and cycle data have been reset.
      </p>
    </section>

    <ProfileSettingsModal
      :open="settingsOpen"
      @close="settingsOpen = false"
      @saved="handleSettingsSaved"
    />

    <p class="mt-5 px-2 text-center text-xs leading-relaxed text-ink-soft">
      CycleFuel is a wellbeing companion, not a medical device. For medical concerns, speak with a healthcare
      professional who knows you.
    </p>
  </div>
</template>
