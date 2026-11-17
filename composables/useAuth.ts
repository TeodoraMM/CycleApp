import type { AuthUser, FoodEntry } from '~/types'
import { useAppState } from '~/composables/useAppState'

type FetchLike = typeof $fetch

export function useAuth() {
  const { state } = useAppState()
  const user = useState<AuthUser | null>('auth:user', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)
  const loading = useState<boolean>('auth:loading', () => false)

  const isAuthenticated = computed(() => Boolean(user.value))

  function request(): FetchLike {
    return import.meta.server ? (useRequestFetch() as FetchLike) : $fetch
  }

  async function loadDiaryEntries(fetcher?: FetchLike): Promise<void> {
    const response = await (fetcher ?? request())<{ entries: FoodEntry[] }>('/api/diary')
    state.value.foods = response.entries
  }

  async function initialize(force = false): Promise<AuthUser | null> {
    if (initialized.value && !force) return user.value

    const fetcher = request()
    loading.value = true
    try {
      try {
        const response = await fetcher<{ user: AuthUser }>('/api/auth/me')
        user.value = response.user
      } catch {
        user.value = null
      }

      if (user.value) {
        try {
          await loadDiaryEntries(fetcher)
        } catch {
          state.value.foods = []
        }
      } else {
        state.value.foods = []
      }
    } finally {
      initialized.value = true
      loading.value = false
    }

    return user.value
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    loading.value = true
    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = response.user
      initialized.value = true
      try {
        await loadDiaryEntries()
      } catch {
        state.value.foods = []
      }
      return response.user
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string): Promise<AuthUser> {
    loading.value = true
    try {
      const response = await $fetch<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: { email, password },
      })
      user.value = response.user
      initialized.value = true
      try {
        await loadDiaryEntries()
      } catch {
        state.value.foods = []
      }
      return response.user
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      initialized.value = true
      state.value.foods = []
      loading.value = false
    }
  }

  async function addDiaryEntry(input: Omit<FoodEntry, 'id'>): Promise<FoodEntry> {
    const response = await $fetch<{ entry: FoodEntry }>('/api/diary', {
      method: 'POST',
      body: input,
    })
    state.value.foods.push(response.entry)
    return response.entry
  }

  async function removeDiaryEntry(id: string): Promise<void> {
    await $fetch(`/api/diary/${encodeURIComponent(id)}`, { method: 'DELETE' })
    state.value.foods = state.value.foods.filter((entry) => entry.id !== id)
  }

  return {
    user,
    initialized,
    loading,
    isAuthenticated,
    initialize,
    loadDiaryEntries,
    login,
    register,
    logout,
    addDiaryEntry,
    removeDiaryEntry,
  }
}
