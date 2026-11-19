<script setup lang="ts">
import { localSyncKey, toStoredCycle, toStoredProfile } from '~/utils/userState'

definePageMeta({ layout: false })

type Mode = 'login' | 'register'

interface AuthSubmission {
  mode: Mode
  email: string
  password: string
  confirm?: string
  firstName?: string
  lastName?: string
}

const route = useRoute()
const { login, register, user } = useAuth()
const { state, updateProfile } = useAppState()

const requestedMode = computed(() => {
  const value = route.query.mode
  return value === 'register' ? 'register' : 'login'
})

const mode = ref<Mode>(requestedMode.value)
const error = ref('')
const submitting = ref(false)
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirm = ref(false)

const firstName = ref('')
const lastName = ref('')
const loginEmail = ref('')
const loginPassword = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirm = ref('')

const isLogin = computed(() => mode.value === 'login')

const redirectPath = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/diary'
})

watch(requestedMode, (value) => {
  mode.value = value
  error.value = ''
})

function switchMode(next: Mode): void {
  mode.value = next
  error.value = ''
  if (route.query.mode !== next) {
    navigateTo({ query: { ...route.query, mode: next } }, { replace: true })
  }
}

function validationError(submission: AuthSubmission): string {
  if (submission.mode === 'register') {
    if (!submission.firstName?.trim()) return 'Enter your first name.'
    if (!submission.lastName?.trim()) return 'Enter your last name.'
  }

  const cleanEmail = submission.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return 'Enter a valid email address.'
  if (submission.password.length < 8) return 'Password must be at least 8 characters long.'
  if (submission.mode === 'register' && submission.password !== submission.confirm) {
    return 'Passwords do not match.'
  }
  return ''
}

function errorMessage(value: unknown): string {
  if (value && typeof value === 'object') {
    const data = (value as { data?: { statusMessage?: unknown; message?: unknown } }).data
    const message = data?.statusMessage || data?.message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Something went wrong. Please try again.'
}

async function submitAuth(submission: AuthSubmission): Promise<void> {
  error.value = ''
  const problem = validationError(submission)
  if (problem) {
    error.value = problem
    return
  }

  submitting.value = true
  try {
    const cleanEmail = submission.email.trim().toLowerCase()
    if (submission.mode === 'register') {
      await register(cleanEmail, submission.password)
      const fullName = [submission.firstName?.trim(), submission.lastName?.trim()].filter(Boolean).join(' ')
      if (fullName && user.value) {
        const key = localSyncKey(user.value.id)
        const started = Date.now()
        while (!window.localStorage.getItem(key) && Date.now() - started < 3000) {
          await new Promise((resolve) => window.setTimeout(resolve, 50))
        }
        updateProfile({ name: fullName })
      }
    } else {
      await login(cleanEmail, submission.password)
    }
    await navigateTo(redirectPath.value)
  } catch (value) {
    error.value = errorMessage(value)
  } finally {
    submitting.value = false
  }
}

function submitLogin(): Promise<void> {
  return submitAuth({
    mode: 'login',
    email: loginEmail.value,
    password: loginPassword.value,
  })
}

function submitRegister(): Promise<void> {
  return submitAuth({
    mode: 'register',
    email: registerEmail.value,
    password: registerPassword.value,
    confirm: registerConfirm.value,
    firstName: firstName.value,
    lastName: lastName.value,
  })
}
</script>

<template>
  <div
    class="relative flex min-h-[100dvh] items-start justify-center overflow-x-hidden overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] pt-[calc(env(safe-area-inset-top)_+_2rem)] sm:items-center sm:px-5 sm:pb-[calc(env(safe-area-inset-bottom)_+_2.5rem)] sm:pt-[calc(env(safe-area-inset-top)_+_2.5rem)]"
  >
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -left-24 -top-16 h-72 w-72 rounded-full bg-blush-200/45 blur-3xl" />
      <div class="absolute -right-28 top-24 h-80 w-80 rounded-full bg-lavender-200/40 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cream-200/70 blur-3xl" />
    </div>

    <div class="w-full min-w-0 max-w-md animate-fade-up">
      <h1 class="sr-only">Log in or create your CycleFuel account</h1>

      <div class="mb-6 flex min-w-0 items-center justify-center gap-2.5">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 via-blush-600 to-plum-600 text-white shadow-glow"
        >
          <AppIcon name="leaf" :size="20" />
        </span>
        <span class="font-display text-xl font-semibold tracking-tight text-ink">CycleFuel</span>
      </div>

      <nav
        class="mx-auto mb-4 grid w-full max-w-sm grid-cols-2 gap-1 rounded-full border border-white/70 bg-white/60 p-1 shadow-sm backdrop-blur-sm"
        aria-label="Authentication"
      >
        <button
          type="button"
          :aria-pressed="isLogin"
          class="min-h-11 rounded-full border border-transparent px-3 text-sm font-semibold transition duration-200"
          :class="
            isLogin
              ? 'border-lavender-200 bg-lavender-100/90 text-plum-700 shadow-sm'
              : 'text-ink-soft hover:bg-white/60'
          "
          @click="switchMode('login')"
        >
          Login
        </button>
        <button
          type="button"
          :aria-pressed="!isLogin"
          class="min-h-11 rounded-full border border-transparent px-3 text-sm font-semibold transition duration-200"
          :class="
            !isLogin
              ? 'border-blush-200 bg-blush-100/90 text-blush-700 shadow-sm'
              : 'text-ink-soft hover:bg-white/60'
          "
          @click="switchMode('register')"
        >
          Sign Up
        </button>
      </nav>

      <section class="card mx-auto w-full max-w-sm !p-5 sm:!p-6">
        <Transition name="auth-form" mode="out-in">
          <form v-if="isLogin" key="login" class="min-w-0 space-y-3" @submit.prevent="submitLogin">
            <div class="min-w-0">
              <label class="label" for="login-email">Email</label>
              <input
                id="login-email"
                v-model="loginEmail"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                inputmode="email"
                enterkeyhint="next"
                class="input mt-1 pr-16"
                placeholder="you@example.com"
                required
              />
            </div>

            <div class="min-w-0">
              <label class="label" for="login-password">Password</label>
              <div class="relative mt-1">
                <input
                  id="login-password"
                  v-model="loginPassword"
                  :type="showLoginPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  enterkeyhint="go"
                  class="input pr-16"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-1 top-1/2 flex min-h-10 min-w-11 -translate-y-1/2 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-plum-700 transition hover:bg-blush-50"
                  :aria-label="showLoginPassword ? 'Hide password' : 'Show password'"
                  @click="showLoginPassword = !showLoginPassword"
                >
                  {{ showLoginPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <p
              v-if="error"
              class="rounded-2xl border border-blush-200/70 bg-blush-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-blush-700"
              role="alert"
            >
              {{ error }}
            </p>

            <button type="submit" class="btn-primary min-h-11 w-full" :disabled="submitting">
              {{ submitting ? 'Please wait...' : 'Login' }}
            </button>

            <div class="flex justify-center pt-1">
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center text-center text-xs text-ink-soft"
                @click="switchMode('register')"
              >
                Don't have an account?
                <span class="ml-1 font-semibold text-blush-700">Sign up</span>
              </button>
            </div>
          </form>

          <form v-else key="register" class="min-w-0 space-y-3" @submit.prevent="submitRegister">
            <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="min-w-0">
                <label class="label" for="register-first-name">First name</label>
                <input
                  id="register-first-name"
                  v-model="firstName"
                  type="text"
                  autocomplete="given-name"
                  enterkeyhint="next"
                  class="input mt-1"
                  placeholder="First name"
                  required
                />
              </div>
              <div class="min-w-0">
                <label class="label" for="register-last-name">Last name</label>
                <input
                  id="register-last-name"
                  v-model="lastName"
                  type="text"
                  autocomplete="family-name"
                  enterkeyhint="next"
                  class="input mt-1"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div class="min-w-0">
              <label class="label" for="register-email">Email</label>
              <input
                id="register-email"
                v-model="registerEmail"
                type="email"
                autocomplete="email"
                autocapitalize="none"
                spellcheck="false"
                inputmode="email"
                enterkeyhint="next"
                class="input mt-1"
                placeholder="you@example.com"
                required
              />
            </div>

            <div class="min-w-0">
              <label class="label" for="register-password">Password</label>
              <div class="relative mt-1">
                <input
                  id="register-password"
                  v-model="registerPassword"
                  :type="showRegisterPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  enterkeyhint="next"
                  class="input pr-16"
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  class="absolute right-1 top-1/2 flex min-h-10 min-w-11 -translate-y-1/2 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-plum-700 transition hover:bg-blush-50"
                  :aria-label="showRegisterPassword ? 'Hide password' : 'Show password'"
                  @click="showRegisterPassword = !showRegisterPassword"
                >
                  {{ showRegisterPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <div class="min-w-0">
              <label class="label" for="register-confirm">Confirm password</label>
              <div class="relative mt-1">
                <input
                  id="register-confirm"
                  v-model="registerConfirm"
                  :type="showRegisterConfirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  enterkeyhint="go"
                  class="input pr-16"
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-1 top-1/2 flex min-h-10 min-w-11 -translate-y-1/2 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-plum-700 transition hover:bg-blush-50"
                  :aria-label="showRegisterConfirm ? 'Hide password' : 'Show password'"
                  @click="showRegisterConfirm = !showRegisterConfirm"
                >
                  {{ showRegisterConfirm ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>

            <p
              v-if="error"
              class="rounded-2xl border border-blush-200/70 bg-blush-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-blush-700"
              role="alert"
            >
              {{ error }}
            </p>

            <button type="submit" class="btn-primary min-h-11 w-full" :disabled="submitting">
              {{ submitting ? 'Please wait...' : 'Sign Up' }}
            </button>

            <div class="flex justify-center pt-1">
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center text-center text-xs text-ink-soft"
                @click="switchMode('login')"
              >
                Already have an account?
                <span class="ml-1 font-semibold text-plum-700">Log in</span>
              </button>
            </div>
          </form>
        </Transition>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-form-enter-active,
.auth-form-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.auth-form-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.auth-form-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
