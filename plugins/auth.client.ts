export default defineNuxtPlugin(() => {
  onNuxtReady(() => {
    const { initialize } = useAuth()
    void initialize()
  })
})
