<script setup lang="ts">
import type {
  AccountStatus,
  ActivityLevel,
  AdminUserDetail,
  CalorieTargetMode,
  CycleEntry,
  DietPreference,
  FoodEntry,
  Goal,
  MealType,
  QuestionnaireRecord,
  StoredUserState,
  SupplementRecord,
  UserProfile,
} from '~/types'
import { useModalAccessibility } from '~/composables/useModalAccessibility'
import { useAuth } from '~/composables/useAuth'
import { GOAL_LIST, GOAL_META } from '~/data/goals'
import { formatShort, isDateKey, todayKey } from '~/utils/date'
import { nextTick, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps<{
  user: AdminUserDetail
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
  notify: [payload: { type: 'success' | 'error'; message: string }]
}>()

type DetailTab =
  | 'personal'
  | 'goals'
  | 'cycle'
  | 'nutrition'
  | 'diary'
  | 'supplements'
  | 'questionnaire'
  | 'account'

type ConfirmState = {
  title: string
  message: string
  confirmLabel: string
  action: () => void | Promise<void>
}

const tabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'personal', label: 'Personal Information' },
  { key: 'goals', label: 'Health Goals' },
  { key: 'cycle', label: 'Menstrual Cycle' },
  { key: 'nutrition', label: 'Nutrition & Calories' },
  { key: 'diary', label: 'Food Diary' },
  { key: 'supplements', label: 'Supplements' },
  { key: 'questionnaire', label: 'Questionnaire Responses' },
  { key: 'account', label: 'Account Information' },
]

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: 'sedentary', label: 'Mostly resting' },
  { value: 'light', label: 'Lightly active' },
  { value: 'moderate', label: 'Moderately active' },
  { value: 'active', label: 'Active' },
  { value: 'veryActive', label: 'Very active' },
]

const dietOptions: Array<{ value: DietPreference; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
]

const mealOptions: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

function cloneUser(value: AdminUserDetail): AdminUserDetail {
  return {
    ...value,
    state: {
      ...value.state,
      profile: value.state.profile ? { ...value.state.profile } : null,
      cycle: value.state.cycle
        ? {
            ...value.state.cycle,
            entries: value.state.cycle.entries.map((entry) => ({ ...entry })),
          }
        : null,
      logs: Object.fromEntries(
        Object.entries(value.state.logs).map(([date, log]) => [date, { ...log }]),
      ),
      supplements: value.state.supplements.map((item) => ({ ...item })),
      questionnaire: value.state.questionnaire.map((item) => ({ ...item })),
    },
    entries: value.entries.map((entry) => ({ ...entry })),
  }
}

const open = ref(true)
const busy = ref(false)
const activeTab = ref<DetailTab>('personal')
const detail = ref<AdminUserDetail>(cloneUser(props.user))
const confirmState = ref<ConfirmState | null>(null)
const confirmCancelButton = ref<HTMLButtonElement | null>(null)
const diaryFormVisible = ref(false)
const editingDiaryId = ref<string | null>(null)

const personalDraft = reactive<{
  name: string
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  dietPreference: DietPreference
}>({
  name: '',
  age: 30,
  heightCm: 165,
  weightKg: 65,
  activityLevel: 'moderate',
  dietPreference: 'balanced',
})

const goalDraft = ref<Goal>('energy')

const cycleDraft = reactive<{
  cycleLength: number | null
  periodLength: number | null
  predictionsEnabled: boolean
}>({
  cycleLength: null,
  periodLength: null,
  predictionsEnabled: true,
})

const nutritionDraft = reactive<{
  calorieMode: CalorieTargetMode
  customCalories: number
  customProtein: number
  customCarbs: number
  customFat: number
}>({
  calorieMode: 'recommended',
  customCalories: 0,
  customProtein: 0,
  customCarbs: 0,
  customFat: 0,
})

const diaryDraft = reactive<Omit<FoodEntry, 'id'>>({
  date: todayKey(),
  meal: 'breakfast',
  name: '',
  serving: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

const supplementDraft = reactive({ name: '', dose: '', frequency: '', notes: '' })
const questionnaireDraft = reactive({ question: '', answer: '' })
const emailDraft = ref('')
const statusDraft = ref<AccountStatus>('active')
const isAdminDraft = ref(false)

const { user: currentAuthUser } = useAuth()

const profile = computed(() => detail.value.state.profile)
const cycle = computed(() => detail.value.state.cycle)
const displayName = computed(() => {
  const name = `${detail.value.firstName} ${detail.value.lastName}`.trim()
  return name || 'User without a name'
})
const currentAdminId = computed(() => currentAuthUser.value?.id ?? null)
const isSelf = computed(() => currentAdminId.value !== null && currentAdminId.value === props.user.id)

const personalValid = computed(() => {
  const age = Number(personalDraft.age)
  const heightCm = Number(personalDraft.heightCm)
  const weightKg = Number(personalDraft.weightKg)
  return (
    Number.isFinite(age) &&
    age >= 16 &&
    age <= 80 &&
    Number.isFinite(heightCm) &&
    heightCm >= 120 &&
    heightCm <= 220 &&
    Number.isFinite(weightKg) &&
    weightKg >= 35 &&
    weightKg <= 200
  )
})

const cycleValid = computed(() => {
  const cycleLength = cycleDraft.cycleLength
  const periodLength = cycleDraft.periodLength
  return (
    cycleLength !== null &&
    periodLength !== null &&
    Number.isFinite(cycleLength) &&
    cycleLength >= 21 &&
    cycleLength <= 45 &&
    Number.isFinite(periodLength) &&
    periodLength >= 2 &&
    periodLength <= 10
  )
})

const nutritionValid = computed(() => {
  const calories = Number(nutritionDraft.customCalories)
  const macros = [
    Number(nutritionDraft.customProtein),
    Number(nutritionDraft.customCarbs),
    Number(nutritionDraft.customFat),
  ]
  return (
    Number.isFinite(calories) &&
    calories >= 800 &&
    calories <= 6000 &&
    macros.every((value) => Number.isFinite(value) && value >= 0 && value <= 1000)
  )
})

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.value.trim()))

const diaryValid = computed(() => {
  const calories = Number(diaryDraft.calories)
  const macros = [Number(diaryDraft.protein), Number(diaryDraft.carbs), Number(diaryDraft.fat)]
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(diaryDraft.date) &&
    diaryDraft.name.trim().length > 0 &&
    diaryDraft.serving.trim().length > 0 &&
    Number.isFinite(calories) &&
    calories > 0 &&
    calories <= 10000 &&
    macros.every((value) => Number.isFinite(value) && value >= 0 && value <= 1000)
  )
})

function success(message: string): void {
  emit('notify', { type: 'success', message })
}

function errorMessage(error: unknown): string {
  const candidate = error as { statusMessage?: string; data?: { statusMessage?: string } }
  return candidate?.data?.statusMessage || candidate?.statusMessage || 'Something went wrong.'
}

function fail(error: unknown): void {
  emit('notify', { type: 'error', message: errorMessage(error) })
}

function formatDateKey(value: string): string {
  return isDateKey(value) ? formatShort(value) : value
}

function formatDateTime(value: string | null): string {
  if (!value) return 'No information stored'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function resetDiaryForm(): void {
  Object.assign(diaryDraft, {
    date: todayKey(),
    meal: 'breakfast',
    name: '',
    serving: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
}

function resetSupplementForm(): void {
  Object.assign(supplementDraft, { name: '', dose: '', frequency: '', notes: '' })
}

function resetQuestionnaireForm(): void {
  Object.assign(questionnaireDraft, { question: '', answer: '' })
}

function syncDrafts(): void {
  const currentProfile = detail.value.state.profile
  personalDraft.name = currentProfile?.name ?? ''
  personalDraft.age = currentProfile?.age ?? 30
  personalDraft.heightCm = currentProfile?.heightCm ?? 165
  personalDraft.weightKg = currentProfile?.weightKg ?? 65
  personalDraft.activityLevel = currentProfile?.activityLevel ?? 'moderate'
  personalDraft.dietPreference = currentProfile?.dietPreference ?? 'balanced'
  goalDraft.value = currentProfile?.goal ?? 'energy'

  cycleDraft.cycleLength = detail.value.state.cycle?.cycleLength ?? null
  cycleDraft.periodLength = detail.value.state.cycle?.periodLength ?? null
  cycleDraft.predictionsEnabled = detail.value.state.cycle?.predictionsEnabled ?? true

  nutritionDraft.calorieMode = currentProfile?.calorieMode ?? 'recommended'
  nutritionDraft.customCalories = currentProfile?.customCalories ?? 0
  nutritionDraft.customProtein = currentProfile?.customProtein ?? 0
  nutritionDraft.customCarbs = currentProfile?.customCarbs ?? 0
  nutritionDraft.customFat = currentProfile?.customFat ?? 0

  emailDraft.value = detail.value.email
  statusDraft.value = detail.value.status
  isAdminDraft.value = detail.value.isAdmin

  editingDiaryId.value = null
  resetDiaryForm()
  resetSupplementForm()
  resetQuestionnaireForm()
}

function close(): void {
  open.value = false
  emit('close')
}

function requestConfirm(state: ConfirmState): void {
  confirmState.value = state
}

async function acceptConfirm(): Promise<void> {
  const state = confirmState.value
  if (!state || busy.value) return
  confirmState.value = null
  await state.action()
}

function onConfirmKeydown(event: KeyboardEvent): void {
  if (!confirmState.value || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  confirmState.value = null
}

async function patchUser(body: Record<string, unknown>, message: string): Promise<boolean> {
  if (busy.value) return false
  busy.value = true
  try {
    const response = await $fetch<{ user: AdminUserDetail }>(`/api/admin/users/${props.user.id}`, {
      method: 'PATCH',
      body,
    })
    detail.value = cloneUser(response.user)
    success(message)
    emit('saved')
    return true
  } catch (error) {
    fail(error)
    return false
  } finally {
    busy.value = false
  }
}

async function savePersonal(): Promise<void> {
  if (!personalValid.value) return
  const base = profile.value ?? {
    name: '',
    age: 0,
    heightCm: 0,
    weightKg: 0,
    activityLevel: 'moderate' as const,
    goal: 'energy' as const,
    dietPreference: 'balanced' as const,
    calorieMode: 'recommended' as const,
    customCalories: 0,
    customProtein: 0,
    customCarbs: 0,
    customFat: 0,
  }
  const changes: Partial<UserProfile> = {
    name: personalDraft.name.trim(),
    age: Math.round(Number(personalDraft.age)),
    heightCm: Math.round(Number(personalDraft.heightCm)),
    weightKg: Math.round(Number(personalDraft.weightKg)),
    activityLevel: personalDraft.activityLevel,
    dietPreference: personalDraft.dietPreference,
  }
  await patchUser({ profile: { ...base, ...changes } }, 'Personal information saved.')
}

async function saveGoal(): Promise<void> {
  const base = profile.value ?? {
    name: '',
    age: 0,
    heightCm: 0,
    weightKg: 0,
    activityLevel: 'moderate' as const,
    goal: 'energy' as const,
    dietPreference: 'balanced' as const,
    calorieMode: 'recommended' as const,
    customCalories: 0,
    customProtein: 0,
    customCarbs: 0,
    customFat: 0,
  }
  await patchUser({ profile: { ...base, goal: goalDraft.value } }, 'Health goal saved.')
}

async function saveCycleSettings(): Promise<void> {
  if (!cycleValid.value) return
  const base = cycle.value ?? { entries: [], cycleLength: 28, periodLength: 5, predictionsEnabled: true }
  await patchUser(
    {
      cycle: {
        ...base,
        cycleLength: cycleDraft.cycleLength,
        periodLength: cycleDraft.periodLength,
        predictionsEnabled: cycleDraft.predictionsEnabled,
      },
    },
    'Cycle settings saved.',
  )
}

function removeCycleEntry(entry: CycleEntry): void {
  requestConfirm({
    title: 'Delete cycle entry?',
    message: `Remove the cycle entry starting ${formatDateKey(entry.start)}?`,
    confirmLabel: 'Delete entry',
    action: async () => {
      const currentCycle = cycle.value ?? { entries: [], cycleLength: 28, periodLength: 5, predictionsEnabled: true }
      await patchUser(
        {
          cycle: {
            ...currentCycle,
            entries: currentCycle.entries.filter(
              (item) => item.start !== entry.start || item.duration !== entry.duration,
            ),
          },
        },
        'Cycle entry deleted.',
      )
    },
  })
}

async function saveNutrition(): Promise<void> {
  if (!nutritionValid.value) return
  const base = profile.value ?? {
    name: '',
    age: 0,
    heightCm: 0,
    weightKg: 0,
    activityLevel: 'moderate' as const,
    goal: 'energy' as const,
    dietPreference: 'balanced' as const,
    calorieMode: 'recommended' as const,
    customCalories: 0,
    customProtein: 0,
    customCarbs: 0,
    customFat: 0,
  }
  await patchUser(
    {
      profile: {
        ...base,
        calorieMode: nutritionDraft.calorieMode,
        customCalories: Math.round(Number(nutritionDraft.customCalories)),
        customProtein: Math.round(Number(nutritionDraft.customProtein)),
        customCarbs: Math.round(Number(nutritionDraft.customCarbs)),
        customFat: Math.round(Number(nutritionDraft.customFat)),
      },
    },
    'Nutrition targets saved.',
  )
}

function diaryInput(): Omit<FoodEntry, 'id'> {
  return {
    date: diaryDraft.date,
    meal: diaryDraft.meal,
    name: diaryDraft.name.trim(),
    serving: diaryDraft.serving.trim(),
    calories: Math.round(Number(diaryDraft.calories)),
    protein: Math.round(Number(diaryDraft.protein) * 10) / 10,
    carbs: Math.round(Number(diaryDraft.carbs) * 10) / 10,
    fat: Math.round(Number(diaryDraft.fat) * 10) / 10,
  }
}

function editDiary(entry: FoodEntry): void {
  editingDiaryId.value = entry.id
  diaryFormVisible.value = true
  Object.assign(diaryDraft, {
    date: entry.date,
    meal: entry.meal,
    name: entry.name,
    serving: entry.serving,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  })
}

function cancelDiaryEdit(): void {
  editingDiaryId.value = null
  resetDiaryForm()
  diaryFormVisible.value = false
}

function replaceEntries(entries: FoodEntry[]): void {
  detail.value = { ...detail.value, entries }
}

async function submitDiary(): Promise<void> {
  if (!diaryValid.value || busy.value) return
  const input = diaryInput()
  const entryId = editingDiaryId.value
  busy.value = true
  try {
    if (entryId) {
      const response = await $fetch<{ entry: FoodEntry }>(
        `/api/admin/users/${props.user.id}/diary/${encodeURIComponent(entryId)}`,
        { method: 'PATCH', body: input },
      )
      replaceEntries(
        detail.value.entries.map((entry) => (entry.id === entryId ? response.entry : entry)),
      )
      success('Food entry updated.')
    } else {
      const response = await $fetch<{ entry: FoodEntry }>(`/api/admin/users/${props.user.id}/diary`, {
        method: 'POST',
        body: input,
      })
      replaceEntries([...detail.value.entries, response.entry])
      success('Food entry added.')
    }
    emit('saved')
    cancelDiaryEdit()
  } catch (error) {
    fail(error)
  } finally {
    busy.value = false
  }
}

function deleteDiary(entry: FoodEntry): void {
  requestConfirm({
    title: 'Delete food entry?',
    message: `Remove ${entry.name} from ${formatDateKey(entry.date)}?`,
    confirmLabel: 'Delete entry',
    action: async () => {
      if (busy.value) return
      busy.value = true
      try {
        await $fetch(
          `/api/admin/users/${props.user.id}/diary/${encodeURIComponent(entry.id)}`,
          { method: 'DELETE' },
        )
        replaceEntries(detail.value.entries.filter((item) => item.id !== entry.id))
        success('Food entry deleted.')
        emit('saved')
      } catch (error) {
        fail(error)
      } finally {
        busy.value = false
      }
    },
  })
}

async function addSupplement(): Promise<void> {
  const name = supplementDraft.name.trim()
  if (!name) {
    emit('notify', { type: 'error', message: 'Supplement name is required.' })
    return
  }
  const record: SupplementRecord = {
    id: '',
    name,
    dose: supplementDraft.dose.trim(),
    frequency: supplementDraft.frequency.trim(),
    notes: supplementDraft.notes.trim(),
  }
  const saved = await patchUser(
    { supplements: [...detail.value.state.supplements, record] },
    'Supplement added.',
  )
  if (saved) resetSupplementForm()
}

function deleteSupplement(item: SupplementRecord): void {
  requestConfirm({
    title: 'Delete supplement?',
    message: `Remove ${item.name} from this user's saved supplements?`,
    confirmLabel: 'Delete supplement',
    action: async () => {
      await patchUser(
        {
          supplements: detail.value.state.supplements.filter(
            (supplement) => supplement.id !== item.id || supplement.name !== item.name,
          ),
        },
        'Supplement deleted.',
      )
    },
  })
}

async function addQuestionnaire(): Promise<void> {
  const question = questionnaireDraft.question.trim()
  if (!question) {
    emit('notify', { type: 'error', message: 'Question is required.' })
    return
  }
  const record: QuestionnaireRecord = {
    id: '',
    question,
    answer: questionnaireDraft.answer.trim(),
    createdAt: new Date().toISOString(),
  }
  const saved = await patchUser(
    { questionnaire: [...detail.value.state.questionnaire, record] },
    'Questionnaire response added.',
  )
  if (saved) resetQuestionnaireForm()
}

function deleteQuestionnaire(item: QuestionnaireRecord): void {
  requestConfirm({
    title: 'Delete response?',
    message: `Remove the saved response to “${item.question}”?`,
    confirmLabel: 'Delete response',
    action: async () => {
      await patchUser(
        {
          questionnaire: detail.value.state.questionnaire.filter(
            (record) => record.id !== item.id || record.question !== item.question,
          ),
        },
        'Questionnaire response deleted.',
      )
    },
  })
}

async function saveAccount(): Promise<void> {
  if (!emailValid.value) {
    emit('notify', { type: 'error', message: 'Enter a valid email address.' })
    return
  }
  await patchUser(
    {
      email: emailDraft.value.trim(),
      status: statusDraft.value,
      isAdmin: isAdminDraft.value,
    },
    'Account information saved.',
  )
}

function deleteAccount(): void {
  if (isSelf.value || busy.value) return
  requestConfirm({
    title: 'Delete user account?',
    message: `Permanently delete ${detail.value.email} and all of their stored data?`,
    confirmLabel: 'Delete account',
    action: async () => {
      if (isSelf.value || busy.value) return
      busy.value = true
      try {
        await $fetch(`/api/admin/users/${props.user.id}`, { method: 'DELETE' })
        success('User account deleted.')
        emit('saved')
        close()
      } catch (error) {
        fail(error)
      } finally {
        busy.value = false
      }
    },
  })
}

watch(detail, syncDrafts, { immediate: true })
watch(
  () => props.user,
  (value) => {
    detail.value = cloneUser(value)
  },
)
watch(confirmState, async (value) => {
  if (!value) return
  await nextTick()
  confirmCancelButton.value?.focus()
})
onMounted(() => window.addEventListener('keydown', onConfirmKeydown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onConfirmKeydown, true))

useModalAccessibility(open, close, { allowEscape: () => !confirmState.value })
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 bg-plum-700/45 backdrop-blur-sm sm:flex sm:justify-end">
        <section
          class="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 border-white/80 bg-cream pb-[env(safe-area-inset-bottom)] shadow-lift sm:m-4 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-3xl sm:rounded-[28px] sm:border sm:pb-0"
          role="dialog"
          :aria-modal="confirmState ? undefined : true"
          aria-labelledby="admin-user-detail-title"
        >
          <header class="modal-header">
            <div class="min-w-0">
              <p class="eyebrow">User detail</p>
              <h2 id="admin-user-detail-title" class="truncate font-display text-lg font-semibold text-ink">
                {{ displayName }}
              </h2>
              <p class="mt-1 truncate text-[11px] text-ink-soft">{{ detail.email }} · ID {{ detail.id }}</p>
            </div>
            <button type="button" class="btn-icon shrink-0" aria-label="Close user detail" @click="close">
              <AppIcon name="x" :size="16" />
            </button>
          </header>

          <nav
            class="shrink-0 overflow-x-auto border-b border-cream-200 px-4 py-3 sm:px-5"
            aria-label="User detail sections"
          >
            <div class="flex w-max gap-2">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="min-h-11 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition sm:min-h-0"
                :class="
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blush-700 to-plum-600 text-white shadow-glow'
                    : 'bg-white/75 text-ink-soft hover:bg-white'
                "
                :aria-current="activeTab === tab.key ? 'page' : undefined"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </nav>

          <div class="modal-body">
            <div v-if="loading" class="space-y-3" aria-live="polite">
              <div class="h-24 animate-pulse rounded-2xl bg-white/70"></div>
              <div class="h-32 animate-pulse rounded-2xl bg-white/70"></div>
              <p class="text-center text-xs text-ink-soft">Loading user details…</p>
            </div>

            <div v-else class="space-y-4">
              <template v-if="activeTab === 'personal'">
                <div v-if="!profile" class="card-tight">
                  <p class="section-title">Personal Information</p>
                  <p class="mt-2 text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <template v-else>
                  <div class="card-tight">
                    <p class="eyebrow">Stored profile</p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <span v-if="profile.name" class="chip">{{ profile.name }}</span>
                      <span class="chip">Age {{ profile.age }}</span>
                      <span class="chip">{{ profile.heightCm }} cm</span>
                      <span class="chip">{{ profile.weightKg }} kg</span>
                    </div>
                  </div>
                  <div class="card space-y-4">
                    <div>
                      <label class="label" for="admin-personal-name">Name</label>
                      <input id="admin-personal-name" v-model="personalDraft.name" class="input mt-1" />
                    </div>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label class="label" for="admin-personal-age">Age</label>
                        <input id="admin-personal-age" v-model.number="personalDraft.age" type="number" min="16" max="80" class="input mt-1" />
                      </div>
                      <div>
                        <label class="label" for="admin-personal-height">Height (cm)</label>
                        <input id="admin-personal-height" v-model.number="personalDraft.heightCm" type="number" min="120" max="220" class="input mt-1" />
                      </div>
                      <div>
                        <label class="label" for="admin-personal-weight">Weight (kg)</label>
                        <input id="admin-personal-weight" v-model.number="personalDraft.weightKg" type="number" min="35" max="200" class="input mt-1" />
                      </div>
                    </div>
                    <div>
                      <label class="label" for="admin-personal-activity">Activity level</label>
                      <select id="admin-personal-activity" v-model="personalDraft.activityLevel" class="input mt-1">
                        <option v-for="option in activityOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="label" for="admin-personal-diet">Diet preference</label>
                      <select id="admin-personal-diet" v-model="personalDraft.dietPreference" class="input mt-1">
                        <option v-for="option in dietOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                    <p v-if="!personalValid" class="text-[11px] font-medium text-blush-600">
                      Age 16–80, height 120–220 cm and weight 35–200 kg are required.
                    </p>
                    <button type="button" class="btn-primary w-full" :disabled="busy || !personalValid" @click="savePersonal">
                      Save personal information
                    </button>
                  </div>
                </template>
              </template>

              <template v-else-if="activeTab === 'goals'">
                <div v-if="!profile" class="card-tight">
                  <p class="section-title">Health Goals</p>
                  <p class="mt-2 text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <div v-else class="card space-y-4">
                  <div>
                    <p class="eyebrow">Current goal</p>
                    <p class="mt-1 text-sm font-semibold text-ink">{{ GOAL_META[profile.goal].label }}</p>
                    <p class="mt-0.5 text-[11px] text-ink-soft">{{ GOAL_META[profile.goal].hint }}</p>
                  </div>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      v-for="goal in GOAL_LIST"
                      :key="goal"
                      type="button"
                      class="min-h-11 rounded-2xl border px-3 py-3 text-left transition sm:min-h-0"
                      :class="
                        goalDraft === goal
                          ? 'border-blush-300 bg-blush-50 shadow-sm'
                          : 'border-white/80 bg-white/65 hover:border-blush-200'
                      "
                      @click="goalDraft = goal"
                    >
                      <span class="block text-xs font-semibold text-ink">{{ GOAL_META[goal].label }}</span>
                      <span class="mt-0.5 block text-[10px] leading-snug text-ink-soft">{{ GOAL_META[goal].hint }}</span>
                    </button>
                  </div>
                  <button type="button" class="btn-primary w-full" :disabled="busy" @click="saveGoal">
                    Save health goal
                  </button>
                </div>
              </template>

              <template v-else-if="activeTab === 'cycle'">
                <div v-if="!cycle" class="card-tight">
                  <p class="section-title">Menstrual Cycle</p>
                  <p class="mt-2 text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <template v-else>
                  <div class="card space-y-4">
                    <div>
                      <p class="eyebrow">Stored settings</p>
                      <div class="mt-2 flex flex-wrap gap-1.5">
                        <span class="chip">{{ cycle.cycleLength }}-day cycle</span>
                        <span class="chip">{{ cycle.periodLength }}-day period</span>
                        <span class="chip">Predictions {{ cycle.predictionsEnabled ? 'on' : 'off' }}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label class="label" for="admin-cycle-length">Cycle length (days)</label>
                        <input id="admin-cycle-length" v-model.number="cycleDraft.cycleLength" type="number" min="21" max="45" class="input mt-1" />
                      </div>
                      <div>
                        <label class="label" for="admin-cycle-period">Period length (days)</label>
                        <input id="admin-cycle-period" v-model.number="cycleDraft.periodLength" type="number" min="2" max="10" class="input mt-1" />
                      </div>
                    </div>
                    <label class="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3 sm:min-h-0">
                      <span class="text-xs font-medium text-ink">Cycle predictions</span>
                      <input v-model="cycleDraft.predictionsEnabled" type="checkbox" class="h-5 w-5 accent-blush-600" />
                    </label>
                    <p v-if="!cycleValid" class="text-[11px] font-medium text-blush-600">
                      Cycle length must be 21–45 days and period length 2–10 days.
                    </p>
                    <button type="button" class="btn-primary w-full" :disabled="busy || !cycleValid" @click="saveCycleSettings">
                      Save cycle settings
                    </button>
                  </div>
                  <div class="card-tight">
                    <div class="flex items-center justify-between gap-2">
                      <p class="eyebrow">Logged period starts</p>
                      <span class="chip">{{ cycle.entries.length }}</span>
                    </div>
                    <p v-if="!cycle.entries.length" class="mt-2 text-xs leading-relaxed text-ink-soft">
                      No information stored
                    </p>
                    <ul v-else class="mt-2 divide-y divide-cream-200">
                      <li
                        v-for="(entry, index) in cycle.entries"
                        :key="`${entry.start}-${index}`"
                        class="flex items-center justify-between gap-3 py-2"
                      >
                        <div>
                          <p class="text-sm font-medium text-ink">{{ formatDateKey(entry.start) }}</p>
                          <p class="text-[11px] text-ink-soft">{{ entry.duration }} days</p>
                        </div>
                        <button type="button" class="btn-icon shrink-0 text-blush-600" aria-label="Delete cycle entry" @click="removeCycleEntry(entry)">
                          <AppIcon name="trash" :size="14" />
                        </button>
                      </li>
                    </ul>
                  </div>
                </template>
              </template>

              <template v-else-if="activeTab === 'nutrition'">
                <div v-if="!profile" class="card-tight">
                  <p class="section-title">Nutrition &amp; Calories</p>
                  <p class="mt-2 text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <div v-else class="card space-y-4">
                  <div>
                    <p class="eyebrow">Current target</p>
                    <p class="mt-1 text-sm font-semibold text-ink">
                      {{ profile.calorieMode === 'custom' ? `${profile.customCalories} kcal` : 'Recommended' }}
                    </p>
                    <p class="mt-0.5 text-[11px] text-ink-soft">
                      Protein {{ profile.customProtein }} g · Carbs {{ profile.customCarbs }} g · Fat {{ profile.customFat }} g
                    </p>
                  </div>
                  <div class="flex gap-2 rounded-full bg-white/70 p-1">
                    <button
                      type="button"
                      class="min-h-11 flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0"
                      :class="nutritionDraft.calorieMode === 'recommended' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
                      @click="nutritionDraft.calorieMode = 'recommended'"
                    >
                      Recommended
                    </button>
                    <button
                      type="button"
                      class="min-h-11 flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0"
                      :class="nutritionDraft.calorieMode === 'custom' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
                      @click="nutritionDraft.calorieMode = 'custom'"
                    >
                      Custom
                    </button>
                  </div>
                  <template v-if="nutritionDraft.calorieMode === 'custom'">
                    <div>
                      <label class="label" for="admin-nutrition-calories">Daily calories</label>
                      <input id="admin-nutrition-calories" v-model.number="nutritionDraft.customCalories" type="number" min="800" max="6000" class="input mt-1" />
                    </div>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label class="label" for="admin-nutrition-protein">Protein (g)</label>
                        <input id="admin-nutrition-protein" v-model.number="nutritionDraft.customProtein" type="number" min="0" max="1000" class="input mt-1" />
                      </div>
                      <div>
                        <label class="label" for="admin-nutrition-carbs">Carbs (g)</label>
                        <input id="admin-nutrition-carbs" v-model.number="nutritionDraft.customCarbs" type="number" min="0" max="1000" class="input mt-1" />
                      </div>
                      <div>
                        <label class="label" for="admin-nutrition-fat">Fat (g)</label>
                        <input id="admin-nutrition-fat" v-model.number="nutritionDraft.customFat" type="number" min="0" max="1000" class="input mt-1" />
                      </div>
                    </div>
                    <p v-if="!nutritionValid" class="text-[11px] font-medium text-blush-600">
                      Calories must be 800–6000 and macros 0–1000.
                    </p>
                  </template>
                  <button type="button" class="btn-primary w-full" :disabled="busy || !nutritionValid" @click="saveNutrition">
                    Save nutrition targets
                  </button>
                </div>
              </template>

              <template v-else-if="activeTab === 'diary'">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="eyebrow">Food Diary</p>
                    <p class="mt-1 text-xs text-ink-soft">{{ detail.entries.length }} stored entries</p>
                  </div>
                  <button type="button" class="btn-soft" @click="diaryFormVisible = !diaryFormVisible">
                    <AppIcon :name="diaryFormVisible ? 'x' : 'plus'" :size="14" />
                    {{ diaryFormVisible ? 'Close' : 'Add entry' }}
                  </button>
                </div>

                <div v-if="diaryFormVisible" class="card space-y-3">
                  <p class="section-title">{{ editingDiaryId ? 'Edit entry' : 'New entry' }}</p>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label class="label" for="admin-diary-date">Date</label>
                      <input id="admin-diary-date" v-model="diaryDraft.date" type="date" class="input mt-1" />
                    </div>
                    <div>
                      <label class="label" for="admin-diary-meal">Meal</label>
                      <select id="admin-diary-meal" v-model="diaryDraft.meal" class="input mt-1">
                        <option v-for="option in mealOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="label" for="admin-diary-name">Food name</label>
                    <input id="admin-diary-name" v-model="diaryDraft.name" class="input mt-1" />
                  </div>
                  <div>
                    <label class="label" for="admin-diary-serving">Serving</label>
                    <input id="admin-diary-serving" v-model="diaryDraft.serving" class="input mt-1" />
                  </div>
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label class="label" for="admin-diary-calories">kcal</label>
                      <input id="admin-diary-calories" v-model.number="diaryDraft.calories" type="number" min="1" max="10000" class="input mt-1" />
                    </div>
                    <div>
                      <label class="label" for="admin-diary-protein">Protein</label>
                      <input id="admin-diary-protein" v-model.number="diaryDraft.protein" type="number" min="0" max="1000" class="input mt-1" />
                    </div>
                    <div>
                      <label class="label" for="admin-diary-carbs">Carbs</label>
                      <input id="admin-diary-carbs" v-model.number="diaryDraft.carbs" type="number" min="0" max="1000" class="input mt-1" />
                    </div>
                    <div>
                      <label class="label" for="admin-diary-fat">Fat</label>
                      <input id="admin-diary-fat" v-model.number="diaryDraft.fat" type="number" min="0" max="1000" class="input mt-1" />
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row">
                    <button type="button" class="btn-primary flex-1" :disabled="busy || !diaryValid" @click="submitDiary">
                      {{ editingDiaryId ? 'Save changes' : 'Add entry' }}
                    </button>
                    <button type="button" class="btn-soft" @click="cancelDiaryEdit">Cancel</button>
                  </div>
                </div>

                <div v-if="!detail.entries.length" class="card-tight">
                  <p class="text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <div v-else class="space-y-2">
                  <article v-for="entry in detail.entries" :key="entry.id" class="card-tight">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-ink">{{ entry.name }}</p>
                        <p class="mt-0.5 text-[11px] text-ink-soft">
                          {{ formatDateKey(entry.date) }} · {{ entry.meal }} · {{ entry.serving }}
                        </p>
                        <p class="mt-1 text-[11px] font-medium text-plum-600">
                          {{ entry.calories }} kcal · P {{ entry.protein }} g · C {{ entry.carbs }} g · F {{ entry.fat }} g
                        </p>
                      </div>
                      <div class="flex shrink-0 gap-1.5">
                        <button type="button" class="btn-icon" aria-label="Edit food entry" @click="editDiary(entry)">
                          <AppIcon name="pencil" :size="14" />
                        </button>
                        <button type="button" class="btn-icon text-blush-600" aria-label="Delete food entry" @click="deleteDiary(entry)">
                          <AppIcon name="trash" :size="14" />
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </template>

              <template v-else-if="activeTab === 'supplements'">
                <div class="card space-y-3">
                  <p class="section-title">Add supplement</p>
                  <div>
                    <label class="label" for="admin-supplement-name">Name</label>
                    <input id="admin-supplement-name" v-model="supplementDraft.name" class="input mt-1" />
                  </div>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label class="label" for="admin-supplement-dose">Dose</label>
                      <input id="admin-supplement-dose" v-model="supplementDraft.dose" class="input mt-1" />
                    </div>
                    <div>
                      <label class="label" for="admin-supplement-frequency">Frequency</label>
                      <input id="admin-supplement-frequency" v-model="supplementDraft.frequency" class="input mt-1" />
                    </div>
                  </div>
                  <div>
                    <label class="label" for="admin-supplement-notes">Notes</label>
                    <textarea id="admin-supplement-notes" v-model="supplementDraft.notes" class="input mt-1" rows="2"></textarea>
                  </div>
                  <button type="button" class="btn-primary w-full" :disabled="busy" @click="addSupplement">
                    Save supplement
                  </button>
                </div>

                <div v-if="!detail.state.supplements.length" class="card-tight">
                  <p class="text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <div v-else class="space-y-2">
                  <article v-for="item in detail.state.supplements" :key="item.id || item.name" class="card-tight">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-ink">{{ item.name }}</p>
                        <p v-if="item.dose || item.frequency" class="mt-0.5 text-[11px] text-ink-soft">
                          {{ [item.dose, item.frequency].filter(Boolean).join(' · ') }}
                        </p>
                        <p v-if="item.notes" class="mt-1 text-[11px] leading-relaxed text-ink-soft">{{ item.notes }}</p>
                      </div>
                      <button type="button" class="btn-icon shrink-0 text-blush-600" aria-label="Delete supplement" @click="deleteSupplement(item)">
                        <AppIcon name="trash" :size="14" />
                      </button>
                    </div>
                  </article>
                </div>
              </template>

              <template v-else-if="activeTab === 'questionnaire'">
                <div class="card space-y-3">
                  <p class="section-title">Add response</p>
                  <div>
                    <label class="label" for="admin-questionnaire-question">Question</label>
                    <input id="admin-questionnaire-question" v-model="questionnaireDraft.question" class="input mt-1" />
                  </div>
                  <div>
                    <label class="label" for="admin-questionnaire-answer">Answer</label>
                    <textarea id="admin-questionnaire-answer" v-model="questionnaireDraft.answer" class="input mt-1" rows="3"></textarea>
                  </div>
                  <button type="button" class="btn-primary w-full" :disabled="busy" @click="addQuestionnaire">
                    Save response
                  </button>
                </div>

                <div v-if="!detail.state.questionnaire.length" class="card-tight">
                  <p class="text-xs leading-relaxed text-ink-soft">No information stored</p>
                </div>
                <div v-else class="space-y-2">
                  <article v-for="item in detail.state.questionnaire" :key="item.id || item.question" class="card-tight">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-ink">{{ item.question }}</p>
                        <p v-if="item.answer" class="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-ink-soft">
                          {{ item.answer }}
                        </p>
                        <p class="mt-1 text-[10px] text-ink-faint">{{ formatDateTime(item.createdAt) }}</p>
                      </div>
                      <button type="button" class="btn-icon shrink-0 text-blush-600" aria-label="Delete questionnaire response" @click="deleteQuestionnaire(item)">
                        <AppIcon name="trash" :size="14" />
                      </button>
                    </div>
                  </article>
                </div>
              </template>

              <template v-else>
                <div class="card-tight">
                  <p class="eyebrow">Account overview</p>
                  <dl class="mt-2 space-y-2 text-xs">
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-ink-soft">Registered</dt>
                      <dd class="text-right font-medium text-ink">{{ formatDateTime(detail.createdAt) }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-ink-soft">Status</dt>
                      <dd class="font-medium text-ink">{{ detail.status }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-ink-soft">Admin role</dt>
                      <dd class="font-medium text-ink">{{ detail.isAdmin ? 'Administrator' : 'Standard user' }}</dd>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <dt class="text-ink-soft">Last activity</dt>
                      <dd class="text-right font-medium text-ink">{{ formatDateTime(detail.lastActivityAt) }}</dd>
                    </div>
                    <div v-if="detail.state.updatedAt" class="flex items-center justify-between gap-3">
                      <dt class="text-ink-soft">State updated</dt>
                      <dd class="text-right font-medium text-ink">{{ formatDateTime(detail.state.updatedAt) }}</dd>
                    </div>
                  </dl>
                </div>

                <div class="card space-y-4">
                  <div>
                    <label class="label" for="admin-account-email">Email</label>
                    <input id="admin-account-email" v-model="emailDraft" type="email" class="input mt-1" />
                    <p v-if="!emailValid" class="mt-1 text-[11px] font-medium text-blush-600">Enter a valid email address.</p>
                  </div>
                  <div>
                    <label class="label" for="admin-account-status">Status</label>
                    <select id="admin-account-status" v-model="statusDraft" class="input mt-1">
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <label class="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3 sm:min-h-0">
                    <span class="text-xs font-medium text-ink">Administrator role</span>
                    <input v-model="isAdminDraft" type="checkbox" class="h-5 w-5 accent-blush-600" />
                  </label>
                  <button type="button" class="btn-primary w-full" :disabled="busy || !emailValid" @click="saveAccount">
                    Save account information
                  </button>
                </div>

                <div class="rounded-[24px] border border-blush-200 bg-blush-50/70 p-4">
                  <p class="text-xs font-semibold text-blush-700">Danger zone</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    Deleting an account removes the user and all stored data associated with it.
                  </p>
                  <button
                    type="button"
                    class="btn-soft mt-3 text-blush-700"
                    :disabled="busy || isSelf"
                    @click="deleteAccount"
                  >
                    <AppIcon name="trash" :size="14" />
                    {{ isSelf ? 'You cannot delete your own account' : 'Delete account' }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="confirmState" class="fixed inset-0 z-[60] flex items-center justify-center bg-plum-700/55 p-4 backdrop-blur-sm" @click.self="confirmState = null">
        <section
          class="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-lift"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-confirm-title"
        >
          <p class="eyebrow">Please confirm</p>
          <h2 id="admin-user-confirm-title" class="mt-1 font-display text-lg font-semibold text-ink">
            {{ confirmState.title }}
          </h2>
          <p class="mt-2 text-xs leading-relaxed text-ink-soft">{{ confirmState.message }}</p>
          <div class="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" class="btn-primary flex-1" :disabled="busy" @click="acceptConfirm">
              {{ confirmState.confirmLabel }}
            </button>
            <button ref="confirmCancelButton" type="button" class="btn-soft flex-1" @click="confirmState = null">
              Cancel
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
