<script setup lang="ts">
import type { ActivityLevel, CalorieTargetMode, DietPreference, UserProfile } from '~/types'
import { useAppState } from '~/composables/useAppState'
import { computePhase } from '~/composables/useCycle'
import { calculateTargets } from '~/composables/useNutrition'
import { PHASE_META } from '~/data/phases'
import { GOAL_LIST, GOAL_META } from '~/data/goals'
import { normalizeCycleLength, normalizePeriodLength } from '~/utils/cycle'
import { formatNumber, todayKey } from '~/utils/date'
import { useModalAccessibility } from '~/composables/useModalAccessibility'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

type SettingsTab = 'calories' | 'personal' | 'cycle'

const { state, updateProfile, updateCycle } = useAppState()

const activeTab = ref<SettingsTab>('calories')
const settingsTabs: Array<{ key: SettingsTab; label: string; icon: string }> = [
  { key: 'calories', label: 'Calories', icon: 'flame' },
  { key: 'personal', label: 'Profile', icon: 'user' },
  { key: 'cycle', label: 'Cycle', icon: 'cycle' },
]
const activeTabIndex = computed(() => settingsTabs.findIndex((tab) => tab.key === activeTab.value))
const mode = ref<CalorieTargetMode>('recommended')
const customCalories = ref(2000)
const customProtein = ref(0)
const customCarbs = ref(0)
const customFat = ref(0)
const personalSaved = ref(false)
const cycleLength = ref(28)
const periodLength = ref(5)
const predictionsEnabled = ref(true)

const activityOptions: Array<{ value: ActivityLevel; label: string; hint: string }> = [
  { value: 'sedentary', label: 'Mostly resting', hint: 'Desk-based days, little movement' },
  { value: 'light', label: 'Lightly active', hint: 'Gentle walks or 1–2 sessions a week' },
  { value: 'moderate', label: 'Moderately active', hint: 'Movement 3–4 times a week' },
  { value: 'active', label: 'Active', hint: 'Frequent training or active days' },
  { value: 'veryActive', label: 'Very active', hint: 'Daily training or physical work' },
]

const dietOptions: Array<{ value: DietPreference; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
]

const profileDraft = reactive<UserProfile>({ ...state.value.profile })

const today = todayKey()
const currentPhase = computed(() => computePhase(today, state.value.cycle))
const phase = computed(() => (currentPhase.value.ready ? currentPhase.value.phase : null))
const phaseMeta = computed(() => (phase.value ? PHASE_META[phase.value] : null))

const recommendedTargets = computed(() => {
  const profile = state.value.profile
  const configured = profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0
  const base = configured ? profile : { ...profile, age: 30, heightCm: 165, weightKg: 65 }
  return calculateTargets({ ...base, calorieMode: 'recommended' }, phase.value)
})
const draftTargets = computed(() =>
  calculateTargets({ ...profileDraft, calorieMode: state.value.profile.calorieMode }, phase.value),
)

const activityHint = computed(
  () => activityOptions.find((option) => option.value === profileDraft.activityLevel)?.hint ?? '',
)

const rawMacroValues = computed(() => [
  Number(customProtein.value),
  Number(customCarbs.value),
  Number(customFat.value),
])

const macroCalories = computed(() => {
  const [protein, carbs, fat] = rawMacroValues.value
  const value = protein * 4 + carbs * 4 + fat * 9
  return Number.isFinite(value) ? Math.round(value) : 0
})

const macroPercent = computed(() => {
  const [protein, carbs, fat] = rawMacroValues.value
  const total = protein * 4 + carbs * 4 + fat * 9
  if (!Number.isFinite(total) || total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  const proteinPercent = Math.round(((protein * 4) / total) * 100)
  const carbsPercent = Math.round(((carbs * 4) / total) * 100)
  return {
    protein: proteinPercent,
    carbs: carbsPercent,
    fat: Math.max(0, 100 - proteinPercent - carbsPercent),
  }
})

const caloriesValid = computed(() => {
  const value = Number(customCalories.value)
  return Number.isFinite(value) && value >= 800 && value <= 6000
})

const macrosValid = computed(() =>
  rawMacroValues.value.every((value) => Number.isFinite(value) && value >= 0),
)

const isValidCustom = computed(() => caloriesValid.value && macrosValid.value)

const cycleValid = computed(() => {
  const length = Number(cycleLength.value)
  const duration = Number(periodLength.value)
  return (
    Number.isFinite(length) &&
    length >= 21 &&
    length <= 45 &&
    Number.isFinite(duration) &&
    duration >= 2 &&
    duration <= 10
  )
})

const personalValid = computed(() => {
  const age = Number(profileDraft.age)
  const height = Number(profileDraft.heightCm)
  const weight = Number(profileDraft.weightKg)
  return (
    Number.isFinite(age) &&
    age >= 16 &&
    age <= 80 &&
    Number.isFinite(height) &&
    height >= 120 &&
    height <= 220 &&
    Number.isFinite(weight) &&
    weight >= 35 &&
    weight <= 200
  )
})

function reset(): void {
  activeTab.value = 'calories'
  const profile = state.value.profile
  mode.value = profile.calorieMode
  const configured = profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0
  Object.assign(profileDraft, {
    ...profile,
    age: configured ? profile.age : 30,
    heightCm: configured ? profile.heightCm : 165,
    weightKg: configured ? profile.weightKg : 65,
  })
  cycleLength.value = state.value.cycle.cycleLength
  periodLength.value = state.value.cycle.periodLength
  predictionsEnabled.value = state.value.cycle.predictionsEnabled
  personalSaved.value = false
  const current = calculateTargets(profile, phase.value)
  const suggested = configured
    ? current
    : calculateTargets({ ...profile, age: 30, heightCm: 165, weightKg: 65 }, phase.value)
  customCalories.value = current.target || suggested.target || 2000
  customProtein.value = current.macros.protein || suggested.macros.protein || 0
  customCarbs.value = current.macros.carbs || suggested.macros.carbs || 0
  customFat.value = current.macros.fat || suggested.macros.fat || 0
}

function applyCalorieSplit(): void {
  const value = Number(customCalories.value)
  if (!Number.isFinite(value) || value < 800 || value > 6000) return

  const protein = Number(customProtein.value) || 0
  const carbs = Number(customCarbs.value) || 0
  const fat = Number(customFat.value) || 0
  const currentCalories = protein * 4 + carbs * 4 + fat * 9

  if (currentCalories > 0) {
    const scale = value / currentCalories
    customProtein.value = Math.max(0, Math.round(protein * scale))
    customCarbs.value = Math.max(0, Math.round(carbs * scale))
    customFat.value = Math.max(0, Math.round(fat * scale))
    return
  }

  const split = recommendedTargets.value.split
  customProtein.value = Math.max(0, Math.round((value * split.protein) / 100 / 4))
  customCarbs.value = Math.max(0, Math.round((value * split.carbs) / 100 / 4))
  customFat.value = Math.max(0, Math.round((value * split.fat) / 100 / 9))
}

function applyMacroCalories(): void {
  const value = macroCalories.value
  if (value > 0) customCalories.value = value
}

function close(): void {
  emit('close')
}

function saveCustom(): void {
  if (!isValidCustom.value) return
  updateProfile({
    calorieMode: 'custom',
    customCalories: Math.round(Number(customCalories.value)),
    customProtein: Math.max(0, Math.round(Number(customProtein.value) || 0)),
    customCarbs: Math.max(0, Math.round(Number(customCarbs.value) || 0)),
    customFat: Math.max(0, Math.round(Number(customFat.value) || 0)),
  })
  emit('saved')
  emit('close')
}

function useRecommendedOnly(): void {
  updateProfile({ calorieMode: 'recommended' })
  emit('saved')
  emit('close')
}

function savePersonalDetails(): void {
  if (!personalValid.value) return
  updateProfile({
    name: profileDraft.name.trim(),
    age: Math.round(Math.min(80, Math.max(16, Number(profileDraft.age) || 0))),
    heightCm: Math.round(Math.min(220, Math.max(120, Number(profileDraft.heightCm) || 0))),
    weightKg: Math.round(Math.min(200, Math.max(35, Number(profileDraft.weightKg) || 0))),
    activityLevel: profileDraft.activityLevel,
    goal: profileDraft.goal,
    dietPreference: profileDraft.dietPreference,
  })
  Object.assign(profileDraft, state.value.profile)
  personalSaved.value = true
  emit('saved')
  window.setTimeout(() => {
    personalSaved.value = false
  }, 2600)
}

function saveCycleSettings(): void {
  if (!cycleValid.value) return
  updateCycle({
    cycleLength: normalizeCycleLength(cycleLength.value),
    periodLength: normalizePeriodLength(periodLength.value),
    predictionsEnabled: predictionsEnabled.value,
  })
  emit('saved')
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) reset()
  },
)

useModalAccessibility(computed(() => props.open), close)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-backdrop" @click.self="close">
        <section
          class="animate-fade-up modal-panel bg-cream sm:max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div class="modal-header border-b-0 pb-1">
            <div class="min-w-0">
              <p class="eyebrow">Settings</p>
              <h2 id="settings-title" class="font-display text-xl font-semibold text-ink">Your settings</h2>
              <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                Fine-tune your targets, personal details and cycle settings.
              </p>
            </div>
            <button type="button" class="btn-icon shrink-0" aria-label="Close" @click="close">
              <AppIcon name="x" :size="16" />
            </button>
          </div>

          <div class="shrink-0 border-b border-cream-200 px-5 py-3">
            <div class="relative grid grid-cols-3 rounded-full bg-plum-50/80 p-1 shadow-inner">
              <div
                class="pointer-events-none absolute bottom-1 left-1 top-1 w-1/3 rounded-full bg-gradient-to-r from-blush-500 to-plum-400 shadow-glow transition-transform duration-300 ease-out"
                :style="{ transform: `translateX(${activeTabIndex * 100}%)` }"
                aria-hidden="true"
              />
              <button
                v-for="tab in settingsTabs"
                :key="tab.key"
                type="button"
                class="relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-full px-1 py-2 text-xs font-semibold transition-colors duration-200 sm:min-h-0 sm:px-2"
                :class="activeTab === tab.key ? 'text-white' : 'text-ink-soft hover:text-plum-600'"
                :aria-current="activeTab === tab.key ? 'page' : undefined"
                @click="activeTab = tab.key"
              >
                <AppIcon :name="tab.icon" :size="13" />
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="modal-body">
            <Transition name="fade" mode="out-in">
              <div :key="activeTab">
                <template v-if="activeTab === 'calories'">
              <div class="flex gap-1 rounded-full bg-white/70 p-1">
                <button
                  type="button"
                  class="flex min-h-11 flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0"
                  :class="mode === 'recommended' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
                  @click="mode = 'recommended'"
                >
                  Recommended
                </button>
                <button
                  type="button"
                  class="flex min-h-11 flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0"
                  :class="mode === 'custom' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
                  @click="mode = 'custom'"
                >
                  Custom
                </button>
              </div>

              <template v-if="mode === 'recommended'">
                <div class="mt-4 rounded-2xl bg-white/70 p-4">
                  <p class="eyebrow">Recommended target</p>
                  <p class="mt-1 font-display text-2xl font-semibold text-ink">
                    {{ formatNumber(recommendedTargets.target) }} kcal
                  </p>
                  <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    Based on your saved personal details and cycle phase. Update them in the Personal details
                    tab whenever anything changes.
                  </p>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span class="chip">{{ recommendedTargets.macros.protein }} g protein</span>
                    <span class="chip">{{ recommendedTargets.macros.carbs }} g carbs</span>
                    <span class="chip">{{ recommendedTargets.macros.fat }} g fat</span>
                  </div>
                </div>

                <button type="button" class="btn-primary mt-4 w-full" @click="useRecommendedOnly">
                  Use recommended target
                </button>
              </template>

              <template v-else>
                <div class="mt-4 rounded-2xl bg-white/70 p-4">
                  <label class="label" for="custom-calories">Daily calorie target</label>
                  <input
                    id="custom-calories"
                    v-model.number="customCalories"
                    type="number"
                    min="800"
                    max="6000"
                    step="10"
                    inputmode="numeric"
                    class="input mt-1"
                    @input="applyCalorieSplit"
                  />
                  <p v-if="!caloriesValid" class="mt-1 text-[11px] font-medium text-blush-600">
                    Enter a calorie target between 800 and 6000 kcal.
                  </p>

                  <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <label class="label" for="custom-protein">Protein</label>
                      <input
                        id="custom-protein"
                        v-model.number="customProtein"
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        inputmode="numeric"
                        class="input mt-1"
                        @input="applyMacroCalories"
                      />
                      <p class="mt-1 text-center text-[11px] font-medium text-plum-600">
                        {{ macroPercent.protein }}%
                      </p>
                    </div>
                    <div>
                      <label class="label" for="custom-carbs">Carbs</label>
                      <input
                        id="custom-carbs"
                        v-model.number="customCarbs"
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        inputmode="numeric"
                        class="input mt-1"
                        @input="applyMacroCalories"
                      />
                      <p class="mt-1 text-center text-[11px] font-medium text-blush-600">
                        {{ macroPercent.carbs }}%
                      </p>
                    </div>
                    <div>
                      <label class="label" for="custom-fat">Fat</label>
                      <input
                        id="custom-fat"
                        v-model.number="customFat"
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        inputmode="numeric"
                        class="input mt-1"
                        @input="applyMacroCalories"
                      />
                      <p class="mt-1 text-center text-[11px] font-medium text-lavender-600">
                        {{ macroPercent.fat }}%
                      </p>
                    </div>
                  </div>
                  <p v-if="!macrosValid" class="mt-1 text-[11px] font-medium text-blush-600">
                    Macro values must be zero or higher.
                  </p>

                  <div class="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                    <span class="text-[11px] text-ink-soft">Macro total</span>
                    <span class="text-[11px] font-semibold text-ink">{{ formatNumber(macroCalories) }} kcal</span>
                  </div>

                  <p class="mt-2 text-[11px] text-ink-soft">
                    Recommended for you: {{ formatNumber(recommendedTargets.target) }} kcal
                  </p>
                </div>

                <button type="button" class="btn-primary mt-4 w-full" :disabled="!isValidCustom" @click="saveCustom">
                  Use custom targets
                </button>
                <p class="mt-2 text-center text-[11px] leading-relaxed text-ink-soft">
                  Your calorie and macro targets will update across the diary and meal plan.
                </p>
              </template>

              <p class="mt-4 text-center text-[11px] leading-relaxed text-ink-soft">
                Supportive estimates, not a prescription. Adjust whenever your needs change.
              </p>
            </template>

            <template v-else-if="activeTab === 'personal'">
              <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                These details power your calorie target and your personalised meal plan ideas.
              </p>

              <div class="mt-4 space-y-4">
                <div>
                  <label class="label" for="settings-name">What should we call you?</label>
                  <input
                    id="settings-name"
                    v-model="profileDraft.name"
                    class="input mt-1"
                    placeholder="Your first name"
                  />
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label class="label" for="settings-age">Age</label>
                    <input
                      id="settings-age"
                      v-model.number="profileDraft.age"
                      type="number"
                      min="16"
                      max="80"
                      class="input mt-1 px-3"
                    />
                  </div>
                  <div>
                    <label class="label" for="settings-height">Height (cm)</label>
                    <input
                      id="settings-height"
                      v-model.number="profileDraft.heightCm"
                      type="number"
                      min="120"
                      max="220"
                      class="input mt-1 px-3"
                    />
                  </div>
                  <div>
                    <label class="label" for="settings-weight">Weight (kg)</label>
                    <input
                      id="settings-weight"
                      v-model.number="profileDraft.weightKg"
                      type="number"
                      min="35"
                      max="200"
                      class="input mt-1 px-3"
                    />
                  </div>
                </div>

                <div>
                  <label class="label" for="settings-activity">Daily movement</label>
                  <select id="settings-activity" v-model="profileDraft.activityLevel" class="input mt-1">
                    <option v-for="option in activityOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <p class="mt-1 text-[11px] text-ink-soft">{{ activityHint }}</p>
                </div>

                <div>
                  <span class="label">Your target</span>
                  <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    We'll shape your calorie target and meal ideas around this.
                  </p>
                  <div class="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      v-for="goalKey in GOAL_LIST"
                      :key="goalKey"
                      type="button"
                      class="min-h-11 rounded-2xl border px-2.5 py-3 text-left transition sm:min-h-0"
                      :class="
                        profileDraft.goal === goalKey
                          ? 'border-blush-300 bg-blush-50 shadow-sm'
                          : 'border-white/80 bg-white/65 hover:border-blush-200'
                      "
                      @click="profileDraft.goal = goalKey"
                    >
                      <span class="text-blush-700"><AppIcon :name="GOAL_META[goalKey].icon" :size="15" /></span>
                      <span class="mt-1 block text-xs font-semibold text-ink">{{ GOAL_META[goalKey].label }}</span>
                      <span class="mt-0.5 block text-[10px] leading-snug text-ink-soft">{{ GOAL_META[goalKey].hint }}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span class="label">Food preference</span>
                  <div class="mt-1.5 flex flex-wrap gap-2">
                    <button
                      v-for="option in dietOptions"
                      :key="option.value"
                      type="button"
                      class="min-h-11 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:min-h-0"
                      :class="
                        profileDraft.dietPreference === option.value
                          ? 'bg-plum-500 text-white shadow-sm'
                          : 'bg-white/75 text-ink-soft hover:bg-white'
                      "
                      @click="profileDraft.dietPreference = option.value"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="rounded-2xl bg-white/70 p-4">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="eyebrow">Cycle phase</p>
                      <p class="mt-1 text-sm font-semibold text-ink">
                        {{
                          currentPhase.ready
                            ? `Day ${currentPhase.cycleDay} · ${phaseMeta?.label ?? ''}`
                            : 'Not set up yet'
                        }}
                      </p>
                    </div>
                    <PhaseBadge v-if="currentPhase.ready" :phase="currentPhase.phase" />
                  </div>
                  <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    {{
                      currentPhase.ready
                        ? 'Your calorie target and meal plan ideas adapt to this phase.'
                        : 'Add your cycle to tailor your calorie target and meal plan ideas to your phase.'
                    }}
                  </p>
                  <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                      type="button"
                      class="inline-flex min-h-11 items-center gap-1 text-[11px] font-semibold text-plum-600 sm:min-h-0"
                      @click="activeTab = 'cycle'"
                    >
                      Edit cycle settings
                      <AppIcon name="arrow-right" :size="12" />
                    </button>
                    <NuxtLink to="/cycle" class="inline-flex min-h-11 items-center text-[11px] font-semibold text-plum-600 sm:min-h-0" @click="close">
                      Open calendar
                    </NuxtLink>
                  </div>
                </div>

                <div class="rounded-2xl bg-white/70 p-4">
                  <p class="eyebrow">Estimated daily target</p>
                  <p class="mt-1 font-display text-2xl font-semibold text-ink">
                    {{ formatNumber(draftTargets.target) }} kcal
                  </p>
                  <p class="mt-1 text-[11px] text-ink-soft">
                    P {{ draftTargets.macros.protein }}g · C {{ draftTargets.macros.carbs }}g · F
                    {{ draftTargets.macros.fat }}g
                  </p>
                  <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    Preview only. Save to apply these details.
                  </p>
                </div>

                <p v-if="!personalValid" class="text-[11px] font-medium leading-relaxed text-blush-600">
                  Age must be 16–80, height 120–220 cm, and weight 35–200 kg.
                </p>

                <button
                  type="button"
                  class="btn-primary w-full"
                  :disabled="!personalValid"
                  @click="savePersonalDetails"
                >
                  Save personal details
                </button>
                <p
                  v-if="personalSaved"
                  class="flex items-center justify-center gap-1.5 text-[11px] font-medium text-lavender-600"
                >
                  <AppIcon name="check" :size="13" /> Personal details saved.
                </p>
              </div>
            </template>

            <template v-else>
              <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                These settings shape your phase estimates, calendar predictions and the period length used when
                you log a start.
              </p>

              <div class="mt-4 space-y-4">
                <div class="rounded-2xl bg-white/70 p-4">
                  <label class="label" for="settings-cycle-length">Average cycle length (days)</label>
                  <input
                    id="settings-cycle-length"
                    v-model.number="cycleLength"
                    type="number"
                    min="21"
                    max="45"
                    step="1"
                    inputmode="numeric"
                    class="input mt-1"
                  />
                  <p class="mt-1 text-[11px] text-ink-soft">From one period start to the next.</p>
                </div>

                <div class="rounded-2xl bg-white/70 p-4">
                  <label class="label" for="settings-period-length">Average period duration (days)</label>
                  <input
                    id="settings-period-length"
                    v-model.number="periodLength"
                    type="number"
                    min="2"
                    max="10"
                    step="1"
                    inputmode="numeric"
                    class="input mt-1"
                  />
                  <p class="mt-1 text-[11px] text-ink-soft">
                    Filled in automatically when you log a new period start.
                  </p>
                </div>

                <div class="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-4">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-ink">Cycle predictions</p>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                      Highlight predicted periods, fertile days and ovulation in the calendar.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="predictionsEnabled"
                    aria-label="Cycle predictions"
                    class="relative h-11 w-16 shrink-0 rounded-full transition sm:h-7 sm:w-12"
                    :class="predictionsEnabled ? 'bg-blush-400' : 'bg-plum-200'"
                    @click="predictionsEnabled = !predictionsEnabled"
                  >
                    <span
                      class="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all sm:h-5 sm:w-5"
                      :class="predictionsEnabled ? 'left-9 sm:left-6' : 'left-1.5 sm:left-1'"
                    />
                  </button>
                </div>

                <p v-if="!cycleValid" class="text-[11px] font-medium leading-relaxed text-blush-600">
                  Cycle length must be 21–45 days and period duration 2–10 days.
                </p>

                <button
                  type="button"
                  class="btn-primary w-full"
                  :disabled="!cycleValid"
                  @click="saveCycleSettings"
                >
                  Save cycle settings
                </button>
                <p class="text-center text-[11px] leading-relaxed text-ink-soft">
                  Period starts themselves are logged on the Cycle page calendar.
                </p>
                <NuxtLink
                  to="/cycle"
                  class="flex min-h-11 items-center justify-center gap-1 text-[11px] font-semibold text-plum-600 sm:min-h-0"
                  @click="close"
                >
                  Open cycle calendar
                  <AppIcon name="arrow-right" :size="12" />
                </NuxtLink>
              </div>
            </template>
              </div>
            </Transition>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
