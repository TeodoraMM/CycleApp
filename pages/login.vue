<script setup lang="ts">
definePageMeta({ layout: false })

type Mode = 'login' | 'register'

const route = useRoute()
const { login, register, loading } = useAuth()

const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const submitting = ref(false)

const isRegister = computed(() => mode.value === 'register')

const redirectPath = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/diary'
})

function switchMode(next: Mode): void {
  mode.value = next
  error.value = ''
  password.value = ''
  confirmPassword.value = ''
}

function errorMessage(value: unknown): string {
  if (value && typeof value === 'object') {
    const data = (value as { data?: { statusMessage?: unknown; message?: unknown } }).data
    const message = data?.statusMessage || data?.message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Something went wrong. Please try again.'
}

async function submit(): Promise<void> {
  error.value = ''
  const cleanEmail = email.value.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    error.value = 'Enter a valid email address.'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters long.'
    return
  }

  if (isRegister.value && password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  submitting.value = true
  try {
    if (isRegister.value) {
      await register(cleanEmail, password.value)
    } else {
      await login(cleanEmail, password.value)
    }
    await navigateTo(redirectPath.value)
  } catch (value) {
    error.value = errorMessage(value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-5 py-10">
    <div class="w-full max-w-md animate-fade-up">
      <div class="mb-6 flex items-center justify-center gap-3">
        <span
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-400 via-blush-500 to-plum-400 text-white shadow-glow"
        >
          <AppIcon name="leaf" :size="24" />
        </span>
        <div class="leading-none">
          <p class="font-display text-2xl font-semibold tracking-tight text-ink">CycleFuel</p>
          <p class="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-plum-400">
            Cycle-aware nourishment
          </p>
        </div>
      </div>

      <section class="card p-5 sm:p-6">
        <div class="flex gap-1 rounded-full bg-white/70 p-1">
          <button
            type="button"
            class="flex-1 rounded-full px-3 py-2 text-xs font-semibold transition"
            :class="mode === 'login' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
            @click="switchMode('login')"
          >
            Log In
          </button>
          <button
            type="button"
            class="flex-1 rounded-full px-3 py-2 text-xs font-semibold transition"
            :class="mode === 'register' ? 'bg-white text-plum-600 shadow-sm' : 'text-ink-soft'"
            @click="switchMode('register')"
          >
            Sign Up
          </button>
        </div>

        <div class="mt-5">
          <p class="eyebrow">{{ isRegister ? 'Create your account' : 'Welcome back' }}</p>
          <h1 class="mt-1 font-display text-2xl font-semibold text-ink">
            {{ isRegister ? 'Start your food diary' : 'Log in to your diary' }}
          </h1>
          <p class="mt-1 text-xs leading-relaxed text-ink-soft">
            {{ isRegister ? 'Your meals stay private to your account.' : 'Your diary is waiting for you.' }}
          </p>
        </div>

        <form class="mt-5 space-y-3" @submit.prevent="submit">
          <div>
            <label class="label" for="auth-email">Email</label>
            <input
              id="auth-email"
              v-model="email"
              type="email"
              autocomplete="email"
              class="input mt-1"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label class="label" for="auth-password">Password</label>
            <input
              id="auth-password"
              v-model="password"
              type="password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              class="input mt-1"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div v-if="isRegister">
            <label class="label" for="auth-confirm">Confirm password</label>
            <input
              id="auth-confirm"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              class="input mt-1"
              placeholder="Repeat your password"
              required
            />
          </div>

          <p
            v-if="error"
            class="rounded-2xl border border-blush-200/70 bg-blush-50 px-3.5 py-2.5 text-[11px] font-medium leading-relaxed text-blush-700"
            role="alert"
          >
            {{ error }}
          </p>

          <button type="submit" class="btn-primary mt-1 w-full" :disabled="submitting || loading">
            <AppIcon name="arrow-right" :size="15" />
            {{ submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in' }}
          </button>
        </form>

        <p class="mt-4 text-center text-[11px] text-ink-soft">
          <template v-if="isRegister">
            Already have an account?
            <button type="button" class="font-semibold text-blush-600" @click="switchMode('login')">Log in</button>
          </template>
          <template v-else>
            New here?
            <button type="button" class="font-semibold text-blush-600" @click="switchMode('register')">Create an account</button>
          </template>
        </p>
      </section>

      <p class="mt-4 px-4 text-center text-[10px] leading-relaxed text-ink-faint">
        Passwords are hashed and your diary is only visible to your account.
      </p>
    </div>
  </div>
</template>
