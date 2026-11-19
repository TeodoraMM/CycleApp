import { createDefaultState } from '~/composables/useAppState'
import { useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'
import type { StoredUserState } from '~/types'
import { localSyncKey, toStoredCycle, toStoredProfile } from '~/utils/userState'

export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    const { state } = useAppState()
    const { user } = useAuth()
    let hydratedUserId: number | null = null
    let pulling = false
    let applying = false
    let timer: number | undefined
    let requestToken = 0

    function snapshot(): Pick<StoredUserState, 'profile' | 'cycle' | 'logs'> {
      return {
        profile: toStoredProfile(state.value.profile),
        cycle: toStoredCycle(state.value.cycle),
        logs: state.value.logs,
      }
    }

    function applyServerState(server: StoredUserState): void {
      const defaults = createDefaultState()
      state.value = {
        ...defaults,
        profile: server.profile ? { ...defaults.profile, ...server.profile } : defaults.profile,
        cycle: server.cycle ? { ...defaults.cycle, ...server.cycle } : defaults.cycle,
        logs: server.logs ?? {},
        foods: state.value.foods,
      }
    }

    async function pull(userId: number): Promise<void> {
      if (pulling || hydratedUserId === userId) return
      pulling = true
      const token = ++requestToken
      try {
        const response = await $fetch<{ state: StoredUserState }>('/api/me/state')
        if (token !== requestToken || user.value?.id !== userId) return
        const known = window.localStorage.getItem(localSyncKey(userId))
        if (known && response.state.updatedAt && response.state.updatedAt < known) {
          hydratedUserId = userId
          return
        }
        applying = true
        applyServerState(response.state)
        hydratedUserId = userId
        await nextTick()
        applying = false
        if (response.state.updatedAt) {
          window.localStorage.setItem(localSyncKey(userId), response.state.updatedAt)
        }
      } finally {
        pulling = false
      }
    }

    async function push(userId: number): Promise<void> {
      if (applying || hydratedUserId !== userId || user.value?.id !== userId) return
      const token = requestToken
      try {
        const response = await $fetch<{ state: StoredUserState }>('/api/me/state', {
          method: 'PUT',
          body: { state: snapshot() },
        })
        if (token !== requestToken || user.value?.id !== userId) return
        if (response.state.updatedAt) {
          window.localStorage.setItem(localSyncKey(userId), response.state.updatedAt)
        }
      } catch {}
    }

    watch(
      () => user.value?.id ?? null,
      (userId, previousId) => {
        requestToken += 1
        window.clearTimeout(timer)
        hydratedUserId = null
        applying = false
        if (previousId) window.localStorage.removeItem(localSyncKey(previousId))
        if (userId) void pull(userId)
      },
      { immediate: true },
    )

    watch(
      state,
      () => {
        const userId = user.value?.id
        if (!userId || hydratedUserId !== userId || applying) return
        window.clearTimeout(timer)
        timer = window.setTimeout(() => void push(userId), 600)
      },
      { deep: true },
    )
  })
})
