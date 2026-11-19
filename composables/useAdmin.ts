import type {
  AdminAuditResponse,
  AdminOverview,
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserSummary,
  FoodEntry,
  Goal,
  StoredUserState,
} from '~/types'

export interface AdminFilters {
  q: string
  goal: Goal | ''
  status: 'active' | 'disabled' | ''
  from: string
  to: string
  sort: 'id' | 'email' | 'createdAt' | 'lastActivityAt' | 'goal'
  dir: 'asc' | 'desc'
  page: number
  pageSize: number
}

function errorMessage(error: unknown): string {
  const candidate = error as {
    statusMessage?: string
    data?: { statusMessage?: string }
  }
  return candidate?.data?.statusMessage || candidate?.statusMessage || 'Something went wrong.'
}

export function useAdmin() {
  const overview = ref<AdminOverview | null>(null)
  const users = ref<AdminUserSummary[]>([])
  const total = ref(0)
  const page = ref(1)
  const totalPages = ref(1)
  const selectedUser = ref<AdminUserDetail | null>(null)
  const audit = ref<AdminAuditResponse | null>(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
  let toastTimer: number | undefined

  const filters = reactive<AdminFilters>({
    q: '',
    goal: '',
    status: '',
    from: '',
    to: '',
    sort: 'createdAt',
    dir: 'desc',
    page: 1,
    pageSize: 10,
  })

  function notify(type: 'success' | 'error', message: string): void {
    toast.value = { type, message }
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toast.value = null
    }, 4000)
  }

  function query(extra: Record<string, string | number> = {}): Record<string, string | number> {
    return {
      q: filters.q,
      goal: filters.goal,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
      dir: filters.dir,
      page: filters.page,
      pageSize: filters.pageSize,
      ...extra,
    }
  }

  async function loadOverview(): Promise<void> {
    loading.value = true
    try {
      overview.value = await $fetch<AdminOverview>('/api/admin/overview')
    } catch (error) {
      notify('error', errorMessage(error))
    } finally {
      loading.value = false
    }
  }

  async function loadUsers(): Promise<void> {
    loading.value = true
    try {
      const response = await $fetch<AdminUserListResponse>('/api/admin/users', {
        query: query(),
      })
      users.value = response.users
      total.value = response.total
      page.value = response.page
      totalPages.value = response.totalPages
    } catch (error) {
      notify('error', errorMessage(error))
    } finally {
      loading.value = false
    }
  }

  async function openUser(id: number): Promise<void> {
    detailLoading.value = true
    try {
      const response = await $fetch<{ user: AdminUserDetail }>(`/api/admin/users/${id}`)
      selectedUser.value = response.user
    } catch (error) {
      notify('error', errorMessage(error))
    } finally {
      detailLoading.value = false
    }
  }

  async function createUser(input: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<boolean> {
    loading.value = true
    try {
      await $fetch('/api/admin/users', { method: 'POST', body: input })
      notify('success', 'User account created.')
      await Promise.all([loadUsers(), loadOverview()])
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: number, patch: Record<string, unknown>): Promise<boolean> {
    detailLoading.value = true
    try {
      const response = await $fetch<{ user: AdminUserDetail }>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: patch,
      })
      selectedUser.value = response.user
      notify('success', 'Changes saved.')
      await Promise.all([loadUsers(), loadOverview()])
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      detailLoading.value = false
    }
  }

  async function deleteUser(id: number): Promise<boolean> {
    loading.value = true
    try {
      await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      selectedUser.value = null
      notify('success', 'User account deleted.')
      await Promise.all([loadUsers(), loadOverview()])
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      loading.value = false
    }
  }

  async function createDiary(id: number, input: Omit<FoodEntry, 'id'>): Promise<boolean> {
    detailLoading.value = true
    try {
      await $fetch(`/api/admin/users/${id}/diary`, { method: 'POST', body: input })
      await openUser(id)
      await loadOverview()
      notify('success', 'Food entry added.')
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      detailLoading.value = false
    }
  }

  async function updateDiary(
    id: number,
    entryId: string,
    input: Omit<FoodEntry, 'id'>,
  ): Promise<boolean> {
    detailLoading.value = true
    try {
      await $fetch(`/api/admin/users/${id}/diary/${entryId}`, {
        method: 'PATCH',
        body: input,
      })
      await openUser(id)
      notify('success', 'Food entry updated.')
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      detailLoading.value = false
    }
  }

  async function deleteDiary(id: number, entryId: string): Promise<boolean> {
    detailLoading.value = true
    try {
      await $fetch(`/api/admin/users/${id}/diary/${entryId}`, { method: 'DELETE' })
      await openUser(id)
      await loadOverview()
      notify('success', 'Food entry deleted.')
      return true
    } catch (error) {
      notify('error', errorMessage(error))
      return false
    } finally {
      detailLoading.value = false
    }
  }

  async function saveState(id: number, state: StoredUserState): Promise<boolean> {
    return updateUser(id, {
      profile: state.profile,
      cycle: state.cycle,
      logs: state.logs,
      supplements: state.supplements,
      questionnaire: state.questionnaire,
    })
  }

  async function loadAudit(): Promise<void> {
    loading.value = true
    try {
      audit.value = await $fetch<AdminAuditResponse>('/api/admin/audit')
    } catch (error) {
      notify('error', errorMessage(error))
    } finally {
      loading.value = false
    }
  }

  async function exportCsv(): Promise<void> {
    try {
      const rows: AdminUserSummary[] = []
      let currentPage = 1
      let totalPagesLocal = 1
      do {
        const response = await $fetch<AdminUserListResponse>('/api/admin/users', {
          query: query({ page: currentPage, pageSize: 100 }),
        })
        rows.push(...response.users)
        totalPagesLocal = response.totalPages
        currentPage += 1
      } while (currentPage <= totalPagesLocal)

      const headers = [
        'ID',
        'First name',
        'Last name',
        'Email',
        'Registered',
        'Status',
        'Goal',
        'Last activity',
        'Admin',
      ]
      const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
      const lines = [
        headers.map(escape).join(','),
        ...rows.map((row) =>
          [
            row.id,
            row.firstName,
            row.lastName,
            row.email,
            row.createdAt,
            row.status,
            row.goal,
            row.lastActivityAt,
            row.isAdmin,
          ]
            .map(escape)
            .join(','),
        ),
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cyclefuel-users-${new Date().toISOString().slice(0, 10)}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
      notify('success', 'CSV export downloaded.')
    } catch (error) {
      notify('error', errorMessage(error))
    }
  }

  return {
    overview,
    users,
    total,
    page,
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
    updateUser,
    deleteUser,
    createDiary,
    updateDiary,
    deleteDiary,
    saveState,
    loadAudit,
    exportCsv,
  }
}
