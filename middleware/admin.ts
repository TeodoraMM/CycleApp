type FetchLike = typeof $fetch

export default defineNuxtRouteMiddleware(async (to) => {
  const request = import.meta.server ? (useRequestFetch() as FetchLike) : $fetch

  try {
    await request('/api/admin/session')
  } catch (error) {
    const status =
      (error as { statusCode?: number; response?: { status?: number } })?.statusCode ??
      (error as { response?: { status?: number } })?.response?.status

    if (status === 401) {
      return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }
    return navigateTo('/')
  }
})
