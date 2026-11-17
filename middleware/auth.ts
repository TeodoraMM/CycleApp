export default defineNuxtRouteMiddleware(async (to) => {
  const { initialize } = useAuth()
  const user = await initialize()

  if (!user) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
