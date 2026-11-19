<script setup lang="ts">
import type { Goal } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const admin = useAdmin()

const {
  overview,
  users,
  total,
  totalPages,
  filters,
  selectedUser,
  audit,
  loading,
  detailLoading,
  toast,
  notify,
  loadOverview,
  loadUsers,
  openUser,
  createUser,
  deleteUser,
  loadAudit,
  exportCsv,
} = admin

const section = computed(() => {
  const value = route.query.section
  if (value === 'users' || value === 'audit') return value
  return 'overview'
})

const searchDraft = ref(filters.q)
let searchTimer: number | undefined

watch(
  () => filters.q,
  (value) => {
    if (value !== searchDraft.value) searchDraft.value = value
  },
)

watch(searchDraft, (value) => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    filters.q = value
    filters.page = 1
    loadUsers()
  }, 350)
})

const createOpen = ref(false)
const createForm = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
})

const confirmOpen = ref(false)
const confirmTarget = ref<{ id: number; email: string } | null>(null)

const goalOptions: { value: Goal | ''; label: string }[] = [
  { value: '', label: 'All goals' },
  { value: 'loseWeight', label: 'Lose weight' },
  { value: 'conceive', label: 'Conceive' },
  { value: 'buildMuscle', label: 'Build muscle' },
  { value: 'energy', label: 'Energy' },
]

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

const sortOptions = [
  { value: 'createdAt', label: 'Registered' },
  { value: 'email', label: 'Email' },
  { value: 'id', label: 'ID' },
  { value: 'lastActivityAt', label: 'Last activity' },
  { value: 'goal', label: 'Goal' },
]

const dirOptions = [
  { value: 'desc', label: 'Desc' },
  { value: 'asc', label: 'Asc' },
]

function goalLabel(goal: Goal | null): string {
  if (!goal) return '—'
  return goalOptions.find((option) => option.value === goal)?.label ?? goal
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function applyFilters() {
  filters.page = 1
  loadUsers()
}

function prevPage() {
  if (filters.page > 1) {
    filters.page -= 1
    loadUsers()
  }
}

function nextPage() {
  if (filters.page < totalPages.value) {
    filters.page += 1
    loadUsers()
  }
}

async function submitCreate() {
  const ok = await createUser({
    email: createForm.email.trim(),
    password: createForm.password,
    firstName: createForm.firstName.trim(),
    lastName: createForm.lastName.trim(),
  })
  if (ok) {
    createOpen.value = false
    createForm.email = ''
    createForm.password = ''
    createForm.firstName = ''
    createForm.lastName = ''
  }
}

function askDelete(user: { id: number; email: string }) {
  confirmTarget.value = user
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!confirmTarget.value) return
  const id = confirmTarget.value.id
  confirmOpen.value = false
  confirmTarget.value = null
  await deleteUser(id)
}

function onUserSaved() {
  loadUsers()
  loadOverview()
}

onMounted(() => {
  loadOverview()
  loadUsers()
  loadAudit()
})
</script>

<template>
  <div class="space-y-6">
    <section v-if="section === 'overview'" class="space-y-6">
      <div v-if="loading && !overview" class="card text-sm text-ink-soft">Loading overview…</div>
      <template v-if="overview">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <AdminStatCard label="Total users" :value="overview.totals.users" icon="user" tone="blush" />
          <AdminStatCard label="New users (7d)" :value="overview.totals.newUsers" icon="sparkles" tone="peach" />
          <AdminStatCard label="Active users (30d)" :value="overview.totals.activeUsers" icon="bolt" tone="lavender" />
          <AdminStatCard label="Food entries" :value="overview.totals.foodEntries" icon="bowl" tone="plum" />
          <AdminStatCard label="User profiles" :value="overview.totals.profiles" icon="target" tone="blush" />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="card">
            <div class="mb-4 flex items-center justify-between gap-2">
              <div>
                <p class="eyebrow">Growth</p>
                <h2 class="section-title mt-1">Registration trend</h2>
              </div>
            </div>
            <BarChart
              v-if="overview.registrationTrend.length"
              :data="overview.registrationTrend"
              color-class="bg-lavender-300"
              highlight-class="bg-blush-400"
              unit="users"
              :show-values="true"
            />
            <p v-else class="text-sm text-ink-soft">No registration data yet.</p>
          </div>

          <div class="card">
            <div class="mb-4 flex items-center justify-between gap-2">
              <div>
                <p class="eyebrow">Engagement</p>
                <h2 class="section-title mt-1">Entry trend</h2>
              </div>
            </div>
            <BarChart
              v-if="overview.entryTrend.length"
              :data="overview.entryTrend"
              color-class="bg-peach-300"
              highlight-class="bg-plum-400"
              unit="entries"
              :show-values="true"
            />
            <p v-else class="text-sm text-ink-soft">No entry data yet.</p>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="card">
            <p class="eyebrow">Goals</p>
            <h2 class="section-title mt-1">Goal breakdown</h2>
            <div class="mt-4 space-y-3">
              <div v-for="item in overview.goalBreakdown" :key="item.goal">
                <div class="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-ink-soft">
                  <span>{{ item.label }}</span>
                  <span class="text-ink">{{ item.count }}</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-cream-200">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-blush-400 to-plum-400 transition-all duration-500"
                    :style="{ width: `${overview.totals.users ? (item.count / overview.totals.users) * 100 : 0}%` }"
                  />
                </div>
              </div>
              <p v-if="!overview.goalBreakdown.length" class="text-sm text-ink-soft">No goal data yet.</p>
            </div>
          </div>

          <div class="card overflow-hidden">
            <p class="eyebrow">Recent</p>
            <h2 class="section-title mt-1">Recent users</h2>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr class="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-faint">
                    <th class="py-2 pr-3 font-semibold">User</th>
                    <th class="py-2 pr-3 font-semibold">Email</th>
                    <th class="py-2 pr-3 font-semibold">Registered</th>
                    <th class="py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in overview.recentUsers" :key="user.id" class="border-b border-cream-100 last:border-0">
                    <td class="py-2.5 pr-3 font-medium text-ink">
                      {{ [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' }}
                    </td>
                    <td class="py-2.5 pr-3 text-ink-soft">{{ user.email }}</td>
                    <td class="py-2.5 pr-3 text-ink-soft">{{ formatDate(user.createdAt) }}</td>
                    <td class="py-2.5">
                      <button type="button" class="btn-soft" @click="openUser(user.id)">Open</button>
                    </td>
                  </tr>
                  <tr v-if="!overview.recentUsers.length">
                    <td colspan="4" class="py-4 text-center text-sm text-ink-soft">No users yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </section>

    <section v-else-if="section === 'users'" class="space-y-4">
      <div class="card space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label class="block">
              <span class="label">Search</span>
              <input v-model="searchDraft" type="search" class="input mt-1" placeholder="Name or email" />
            </label>
            <label class="block">
              <span class="label">Goal</span>
              <select v-model="filters.goal" class="input mt-1" @change="applyFilters">
                <option v-for="option in goalOptions" :key="option.label" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="label">Status</span>
              <select v-model="filters.status" class="input mt-1" @change="applyFilters">
                <option v-for="option in statusOptions" :key="option.label" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="label">Sort</span>
              <select v-model="filters.sort" class="input mt-1" @change="applyFilters">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="label">Direction</span>
              <select v-model="filters.dir" class="input mt-1" @change="applyFilters">
                <option v-for="option in dirOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="label">From</span>
                <input v-model="filters.from" type="date" class="input mt-1" @change="applyFilters" />
              </label>
              <label class="block">
                <span class="label">To</span>
                <input v-model="filters.to" type="date" class="input mt-1" @change="applyFilters" />
              </label>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-soft" @click="exportCsv">
              <AppIcon name="arrow-right" :size="16" />
              Export CSV
            </button>
            <button type="button" class="btn-primary" @click="createOpen = true">
              <AppIcon name="plus" :size="16" />
              Create user
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr class="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-faint">
                <th class="py-2 pr-3 font-semibold">ID</th>
                <th class="py-2 pr-3 font-semibold">First name</th>
                <th class="py-2 pr-3 font-semibold">Last name</th>
                <th class="py-2 pr-3 font-semibold">Email</th>
                <th class="py-2 pr-3 font-semibold">Registered</th>
                <th class="py-2 pr-3 font-semibold">Status</th>
                <th class="py-2 pr-3 font-semibold">Objective</th>
                <th class="py-2 pr-3 font-semibold">Last activity</th>
                <th class="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-b border-cream-100 align-top last:border-0">
                <td class="py-2.5 pr-3 text-ink-soft">{{ user.id }}</td>
                <td class="py-2.5 pr-3 font-medium text-ink">{{ user.firstName || '—' }}</td>
                <td class="py-2.5 pr-3 font-medium text-ink">{{ user.lastName || '—' }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ user.email }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ formatDate(user.createdAt) }}</td>
                <td class="py-2.5 pr-3">
                  <span
                    class="chip-accent"
                    :class="user.status === 'active' ? 'bg-lavender-100 text-lavender-600' : 'bg-blush-100 text-blush-600'"
                  >
                    {{ user.status }}
                  </span>
                </td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ goalLabel(user.goal) }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ formatDateTime(user.lastActivityAt) }}</td>
                <td class="py-2.5">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn-soft" @click="openUser(user.id)">Open</button>
                    <button
                      type="button"
                      class="inline-flex min-h-10 items-center justify-center rounded-full bg-blush-50 px-3.5 py-2 text-xs font-semibold text-blush-700 transition hover:bg-blush-100 sm:min-h-0"
                      @click="askDelete({ id: user.id, email: user.email })"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!users.length && !loading">
                <td colspan="9" class="py-6 text-center text-sm text-ink-soft">No users found.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="9" class="py-6 text-center text-sm text-ink-soft">Loading users…</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col items-center justify-between gap-3 border-t border-cream-200 pt-3 sm:flex-row">
          <p class="text-xs text-ink-soft">
            {{ total }} total · Page {{ filters.page }} of {{ Math.max(totalPages, 1) }}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-soft" :disabled="filters.page <= 1 || loading" @click="prevPage">
              <AppIcon name="chevron-left" :size="16" />
              Prev
            </button>
            <button type="button" class="btn-soft" :disabled="filters.page >= totalPages || loading" @click="nextPage">
              Next
              <AppIcon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="space-y-4">
      <div class="card overflow-hidden">
        <p class="eyebrow">Activity</p>
        <h2 class="section-title mt-1">Audit log</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr class="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-faint">
                <th class="py-2 pr-3 font-semibold">Time</th>
                <th class="py-2 pr-3 font-semibold">Admin</th>
                <th class="py-2 pr-3 font-semibold">Action</th>
                <th class="py-2 pr-3 font-semibold">Target</th>
                <th class="py-2 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in audit?.entries || []" :key="entry.id" class="border-b border-cream-100 align-top last:border-0">
                <td class="whitespace-nowrap py-2.5 pr-3 text-ink-soft">{{ formatDateTime(entry.createdAt) }}</td>
                <td class="py-2.5 pr-3 text-ink">
                  <div class="font-medium">{{ entry.adminEmail }}</div>
                  <div class="text-xs text-ink-faint">#{{ entry.adminId }}</div>
                </td>
                <td class="py-2.5 pr-3 font-medium text-plum-700">{{ entry.action }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">
                  {{ entry.targetType }}<span v-if="entry.targetId"> #{{ entry.targetId }}</span>
                </td>
                <td class="max-w-md py-2.5 text-xs leading-relaxed text-ink-soft">{{ entry.details }}</td>
              </tr>
              <tr v-if="!audit?.entries?.length && !loading">
                <td colspan="5" class="py-6 text-center text-sm text-ink-soft">No audit entries yet.</td>
              </tr>
              <tr v-if="loading && !audit">
                <td colspan="5" class="py-6 text-center text-sm text-ink-soft">Loading audit log…</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createOpen" class="modal-backdrop" @click.self="createOpen = false">
          <div class="modal-panel" role="dialog" aria-modal="true" aria-label="Create user">
            <div class="modal-header">
              <div>
                <p class="eyebrow">Users</p>
                <h2 class="section-title mt-1">Create user</h2>
              </div>
              <button type="button" class="btn-icon" aria-label="Close" @click="createOpen = false">
                <AppIcon name="x" :size="18" />
              </button>
            </div>
            <form @submit.prevent="submitCreate">
              <div class="modal-body space-y-3">
                <label class="block">
                  <span class="label">Email</span>
                  <input v-model="createForm.email" type="email" required class="input mt-1" autocomplete="off" />
                </label>
                <label class="block">
                  <span class="label">Password</span>
                  <input v-model="createForm.password" type="password" required minlength="8" class="input mt-1" autocomplete="new-password" />
                </label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="block">
                    <span class="label">First name</span>
                    <input v-model="createForm.firstName" type="text" class="input mt-1" />
                  </label>
                  <label class="block">
                    <span class="label">Last name</span>
                    <input v-model="createForm.lastName" type="text" class="input mt-1" />
                  </label>
                </div>
              </div>
              <div class="modal-footer sm:justify-end">
                <button type="button" class="btn-soft" @click="createOpen = false">Cancel</button>
                <button type="submit" class="btn-primary" :disabled="loading">Create account</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <AdminConfirmDialog
      :open="confirmOpen"
      title="Delete user account"
      :message="confirmTarget ? `Delete ${confirmTarget.email}? This action cannot be undone.` : ''"
      confirm-label="Delete"
      :destructive="true"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false; confirmTarget = null"
    />

    <AdminUserDetail
      v-if="selectedUser"
      :user="selectedUser"
      @close="selectedUser = null"
      @saved="onUserSaved"
      @notify="(p) => notify(p.type, p.message)"
    />

    <AdminToast :toast="toast" />
  </div>
</template>
