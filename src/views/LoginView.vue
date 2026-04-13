<script setup lang="ts">
import { Lock, Message, User } from '@element-plus/icons-vue'
import axios from 'axios'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { loginUser, registerUser, type UserLoginRequest, type UserRegisterRequest } from '../api/auth'
import OjThemeToggle from '../components/layout/OjThemeToggle.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import { useRoute, useRouter } from 'vue-router'
import { useShellTheme } from '../composables/useShellTheme'
import { useUserStore, type UserRole } from '../stores/user'
import { ojMessage } from '../utils/message'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { theme, toggleTheme } = useShellTheme()
const LOGIN_REMEMBER_KEY = 'oj-login-remember'
const LOGIN_ACCOUNT_KEY = 'oj-login-account'
const LOGIN_PASSWORD_KEY = 'oj-login-password'

const loading = ref(false)
const registerLoading = ref(false)
const authMode = ref<'login' | 'register'>('login')
const remember = ref(false)
const loginAutofillNonce = ref(`${Date.now()}`)
const isDark = computed(() => theme.value === 'dark')
const isRegisterMode = computed(() => authMode.value === 'register')
const loginFormRef = ref<HTMLElement | null>(null)
const registerFormRef = ref<HTMLElement | null>(null)
const authFormsHeight = ref(360)

const meshBackgroundLight = `
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(109, 78, 230, 0.14), transparent 55%),
  radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.1), transparent 50%),
  radial-gradient(ellipse 50% 30% at 50% 100%, rgba(109, 78, 230, 0.06), transparent 45%)
`

const meshBackgroundDark = `
  radial-gradient(ellipse 80% 50% at 20% -10%, rgba(124, 92, 255, 0.22), transparent 55%),
  radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.12), transparent 50%),
  radial-gradient(ellipse 50% 30% at 50% 100%, rgba(124, 92, 255, 0.08), transparent 45%)
`

const heroBackgroundLight = `
  linear-gradient(145deg, rgba(109, 78, 230, 0.12) 0%, transparent 45%),
  linear-gradient(215deg, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
  linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.98) 100%)
`

const heroBackgroundDark = `
  linear-gradient(145deg, rgba(124, 92, 255, 0.18) 0%, transparent 45%),
  linear-gradient(215deg, rgba(56, 189, 248, 0.12) 0%, transparent 50%),
  linear-gradient(180deg, rgba(18, 21, 31, 0.92) 0%, rgba(12, 14, 20, 0.98) 100%)
`

const meshStyle = computed(() => ({
  background: isDark.value ? meshBackgroundDark : meshBackgroundLight,
}))

const heroStyle = computed(() => ({
  background: isDark.value ? heroBackgroundDark : heroBackgroundLight,
}))

const form = reactive({
  username: '',
  password: '',
})

type RegisterFormState = Omit<UserRegisterRequest, 'email'> & { email: string }

const registerForm = reactive<RegisterFormState>({
  username: '',
  password: '',
  checkPassword: '',
  realName: '',
  email: '',
})

function resolveAuthModeFromQuery() {
  authMode.value = route.query.mode === 'register' ? 'register' : 'login'
}

function resolveRoleByCodes(roleCodes: string[] | undefined): UserRole {
  const normalized = (roleCodes ?? []).map((code) => code.toUpperCase())

  if (normalized.some((code) => code.includes('ADMIN'))) {
    return 'admin'
  }
  if (normalized.some((code) => code.includes('TEACHER'))) {
    return 'teacher'
  }
  return 'student'
}

function applyUserSession(
  nextToken: string,
  nextRole: UserRole,
  nextDisplayName: string,
  nextAvatar = '',
  nextUserId = '',
  nextUsername = '',
) {
  type UserStoreCompat = {
    setSession?: (
      token: string,
      role: UserRole,
      displayName: string,
      avatar?: string,
      userId?: string,
      username?: string,
    ) => void
    login?: (role: UserRole, displayName?: string, avatar?: string) => void
    $patch?: (state: Record<string, unknown>) => void
    token?: string
    role?: UserRole
    userId?: string
    username?: string
    displayName?: string
    avatar?: string
  }

  const store = userStore as unknown as UserStoreCompat

  if (typeof store.setSession === 'function') {
    store.setSession(nextToken, nextRole, nextDisplayName, nextAvatar, nextUserId, nextUsername)
    return
  }

  if (typeof store.login === 'function') {
    store.login(nextRole, nextDisplayName, nextAvatar)
  }

  store.$patch?.({
    token: nextToken,
    role: nextRole,
    userId: nextUserId,
    username: nextUsername,
    displayName: nextDisplayName,
    avatar: nextAvatar,
  })

  store.token = nextToken
  store.role = nextRole
  store.userId = nextUserId
  store.username = nextUsername
  store.displayName = nextDisplayName
  store.avatar = nextAvatar

  localStorage.setItem('oj-token', nextToken)
  localStorage.setItem('oj-role', nextRole)
  if (nextUserId) {
    localStorage.setItem('oj-user-id', nextUserId)
  } else {
    localStorage.removeItem('oj-user-id')
  }
  if (nextUsername) {
    localStorage.setItem('oj-username', nextUsername)
  } else {
    localStorage.removeItem('oj-username')
  }
  localStorage.setItem('oj-display-name', nextDisplayName)
  if (nextAvatar) {
    localStorage.setItem('oj-avatar', nextAvatar)
  } else {
    localStorage.removeItem('oj-avatar')
  }
}

function persistRememberPreference() {
  localStorage.setItem(LOGIN_REMEMBER_KEY, remember.value ? '1' : '0')
  if (!remember.value) {
    localStorage.removeItem(LOGIN_ACCOUNT_KEY)
    localStorage.removeItem(LOGIN_PASSWORD_KEY)
  }
}

function hydrateRememberPreference() {
  const remembered = localStorage.getItem(LOGIN_REMEMBER_KEY) === '1'
  const rememberedAccount = localStorage.getItem(LOGIN_ACCOUNT_KEY) ?? ''
  const rememberedPassword = localStorage.getItem(LOGIN_PASSWORD_KEY) ?? ''

  remember.value = remembered
  form.username = remembered ? rememberedAccount : ''
  form.password = remembered ? rememberedPassword : ''

  if (!remembered) {
    localStorage.removeItem(LOGIN_ACCOUNT_KEY)
    localStorage.removeItem(LOGIN_PASSWORD_KEY)
  }
}

function preventBrowserAutofillWhenDisabled(clearFields = true) {
  if (remember.value) {
    return
  }

  loginAutofillNonce.value = `${Date.now()}`
  if (clearFields) {
    form.username = ''
    form.password = ''
  }
}

async function handleLogin() {
  const payload: UserLoginRequest = {
    username: form.username.trim(),
    password: form.password,
  }

  if (!payload.username || !payload.password) {
    ojMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    const response = await loginUser(payload)

    if (response.code !== 0 || !response.data) {
      ojMessage.error(response.message || '登录失败')
      return
    }

    const token = response.data.token?.trim()
    const userInfo = response.data.userInfo

    if (!token || !userInfo) {
      ojMessage.error('登录响应异常，请稍后重试')
      return
    }

    const role = resolveRoleByCodes(userInfo.roles)
    const displayName = userInfo.realName?.trim() || userInfo.username || payload.username

    persistRememberPreference()
    if (remember.value) {
      localStorage.setItem(LOGIN_ACCOUNT_KEY, payload.username)
      localStorage.setItem(LOGIN_PASSWORD_KEY, payload.password)
    }

    applyUserSession(
      token,
      role,
      displayName,
      userInfo.avatar || '',
      userInfo.id || '',
      userInfo.username || payload.username,
    )
    ojMessage.success('登录成功')
    await router.push('/')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function resetRegisterForm() {
  registerForm.username = ''
  registerForm.password = ''
  registerForm.checkPassword = ''
  registerForm.realName = ''
  registerForm.email = ''
}

function switchAuthMode(nextMode: 'login' | 'register') {
  if (loading.value || registerLoading.value || authMode.value === nextMode) {
    return
  }

  authMode.value = nextMode
  if (nextMode === 'register') {
    registerForm.username = ''
    registerForm.password = ''
    registerForm.checkPassword = ''
    registerForm.realName = ''
    registerForm.email = ''
  }
}

function getActiveFormHeight() {
  const active = isRegisterMode.value ? registerFormRef.value : loginFormRef.value
  return active?.offsetHeight ?? 0
}

function syncAuthFormsHeight() {
  const next = getActiveFormHeight()
  if (next > 0) {
    authFormsHeight.value = next
  }
}

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '请求失败，请稍后再试'
  }
  return error instanceof Error ? error.message : '请求失败，请稍后再试'
}

async function handleRegister() {
  const email = registerForm.email.trim()
  const payload: UserRegisterRequest = {
    username: registerForm.username.trim(),
    password: registerForm.password,
    checkPassword: registerForm.checkPassword,
    realName: registerForm.realName.trim(),
    ...(email ? { email } : {}),
  }

  if (!payload.username || !payload.password || !payload.checkPassword || !payload.realName) {
    ojMessage.warning('请完整填写注册信息')
    return
  }

  registerLoading.value = true
  try {
    const response = await registerUser(payload)

    if (response.code !== 0) {
      ojMessage.error(response.message || '注册失败')
      return
    }

    ojMessage.success('注册成功，请登录')
    authMode.value = 'login'
    form.username = payload.username
    form.password = payload.password
    resetRegisterForm()
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    registerLoading.value = false
  }
}

watch(isRegisterMode, async () => {
  await nextTick()
  syncAuthFormsHeight()
})

watch(remember, () => {
  persistRememberPreference()
  preventBrowserAutofillWhenDisabled(false)
})

onMounted(async () => {
  resolveAuthModeFromQuery()
  hydrateRememberPreference()
  preventBrowserAutofillWhenDisabled()
  await nextTick()
  syncAuthFormsHeight()
  requestAnimationFrame(() => {
    preventBrowserAutofillWhenDisabled()
  })
  setTimeout(() => {
    preventBrowserAutofillWhenDisabled()
  }, 120)
  window.addEventListener('resize', syncAuthFormsHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncAuthFormsHeight)
})
</script>

<template>
  <div class="login-page h-screen overflow-hidden bg-transparent">
    <div class="bg-mesh pointer-events-none fixed inset-0 z-0" :style="meshStyle" aria-hidden="true"></div>

    <div class="relative z-10 flex h-full flex-col lg:flex-row">
      <aside
        class="relative hidden overflow-hidden border-slate-200/50 lg:flex lg:w-[min(44vw,520px)] lg:flex-col lg:justify-between lg:border-r lg:px-10 lg:py-9 dark:border-white/[0.06]"
        :style="heroStyle"
      >
        <div class="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/25"></div>
        <div class="pointer-events-none absolute -left-16 bottom-1/4 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-400/20"></div>
        <div class="relative">
          <RouterLink to="/" class="inline-flex items-center gap-3 rounded-xl text-inherit no-underline transition hover:opacity-90">
            <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 font-mono text-base font-bold text-white shadow-xl shadow-violet-500/30">{ }</div>
            <div class="leading-tight">
              <span class="block text-lg font-semibold tracking-tight">CodeArena</span>
              <span class="text-sm text-slate-500 dark:text-slate-400">在线评测</span>
            </div>
          </RouterLink>
          <h1 class="mt-10 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            写代码，交评测，<span class="bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-sky-400">看结果</span>。
          </h1>
          <p class="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400">
            与全站选手同台刷题，支持多语言评测与实时队列；登录后可同步提交记录与比赛报名。
          </p>
        </div>
        <div class="relative mt-6 grid grid-cols-3 gap-3 border-t border-slate-200/60 pt-6 dark:border-white/[0.08]">
          <div class="rounded-xl border border-slate-200/80 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-[#12151f]/60">
            <div class="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">3.8k+</div>
            <div class="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">题目</div>
          </div>
          <div class="rounded-xl border border-slate-200/80 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-[#12151f]/60">
            <div class="font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">18k+</div>
            <div class="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">日提交</div>
          </div>
          <div class="rounded-xl border border-slate-200/80 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-[#12151f]/60">
            <div class="font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">&lt;2s</div>
            <div class="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">平均等待</div>
          </div>
        </div>
      </aside>

      <div class="flex flex-1 flex-col">
        <header class="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0c0e14]/70 lg:border-0 lg:bg-transparent lg:px-8 lg:pt-8 lg:backdrop-blur-none">
          <RouterLink to="/" class="inline-flex items-center gap-2.5 rounded-lg text-inherit no-underline transition hover:opacity-90 lg:hidden">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 font-mono text-sm font-bold text-white shadow-lg shadow-violet-500/25">{ }</div>
            <span class="font-semibold tracking-tight">CodeArena</span>
          </RouterLink>
          <div class="ml-auto flex items-center gap-2">
            <RouterLink to="/" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100">返回首页</RouterLink>
            <OjThemeToggle :is-dark="isDark" @toggle="toggleTheme" />
          </div>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center px-4 pb-4 pt-3 sm:px-6 lg:px-12 lg:pb-8 lg:pt-2">
          <div class="w-full max-w-[420px]">
            <div class="mb-5 text-center lg:text-left">
              <h2 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">欢迎回来</h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {{ isRegisterMode ? '创建账号后即可进入评测系统并同步提交记录。' : '使用账号登录以提交代码、参加比赛并同步记录。' }}
              </p>
            </div>

            <div class="auth-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark sm:p-6" :class="{ 'is-register': isRegisterMode }">
              <div class="mb-4 grid grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-[#181c2a]">
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-sm font-medium transition"
                  :class="!isRegisterMode ? 'bg-white text-slate-900 shadow-sm dark:bg-[#12151f] dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
                  @click="switchAuthMode('login')"
                >
                  登录
                </button>
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-sm font-medium transition"
                  :class="isRegisterMode ? 'bg-white text-slate-900 shadow-sm dark:bg-[#12151f] dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
                  @click="switchAuthMode('register')"
                >
                  注册
                </button>
              </div>

              <div
                class="auth-forms"
                :style="{ height: `${authFormsHeight}px` }"
              >
                <form
                  ref="loginFormRef"
                  class="auth-form-pane space-y-4"
                  :class="isRegisterMode ? 'is-hidden-left' : 'is-active'"
                  autocomplete="off"
                  @submit.prevent="handleLogin"
                >
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">用户名或邮箱</label>
                    <OjInput
                      v-model="form.username"
                      :prefix-icon="User"
                      placeholder="star_x 或 name@school.edu"
                      autocomplete="off"
                      :name="`oj_login_account_${loginAutofillNonce}`"
                    />
                  </div>
                  <div>
                    <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <label class="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
                      <a href="#" class="text-xs font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400">忘记密码？</a>
                    </div>
                    <OjInput
                      v-model="form.password"
                      :prefix-icon="Lock"
                      placeholder="请输入密码"
                      show-password
                      type="password"
                      autocomplete="new-password"
                      :name="`oj_login_password_${loginAutofillNonce}`"
                    />
                  </div>
                  <label class="flex items-center gap-2">
                    <input v-model="remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/40 dark:border-white/20 dark:bg-[#181c2a]" />
                    <span class="text-sm text-slate-600 dark:text-slate-400">在此设备上保持登录（30 天）</span>
                  </label>
                  <OjButton :loading="loading" block size="large" tone="primary" native-type="submit">
                    登录
                  </OjButton>
                  <p class="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
                    还没有账号？
                    <button
                      type="button"
                      class="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                      @click="switchAuthMode('register')"
                    >
                      去注册
                    </button>
                  </p>
                </form>

                <form
                  ref="registerFormRef"
                  class="auth-form-pane space-y-4"
                  :class="isRegisterMode ? 'is-active' : 'is-hidden-right'"
                  autocomplete="off"
                  @submit.prevent="handleRegister"
                >
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
                    <OjInput
                      v-model="registerForm.username"
                      :prefix-icon="User"
                      placeholder="至少 4 位，例如 star_x"
                      autocomplete="off"
                      name="oj_register_username"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">真实姓名</label>
                    <OjInput
                      v-model="registerForm.realName"
                      :prefix-icon="User"
                      placeholder="请输入真实姓名"
                      autocomplete="off"
                      name="oj_register_real_name"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">邮箱（选填）</label>
                    <OjInput
                      v-model="registerForm.email"
                      :prefix-icon="Message"
                      placeholder="name@example.com"
                      autocomplete="off"
                      name="oj_register_email"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
                    <OjInput
                      v-model="registerForm.password"
                      :prefix-icon="Lock"
                      type="password"
                      show-password
                      placeholder="至少 6 位密码"
                      autocomplete="new-password"
                      name="oj_register_password"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">确认密码</label>
                    <OjInput
                      v-model="registerForm.checkPassword"
                      :prefix-icon="Lock"
                      type="password"
                      show-password
                      placeholder="再次输入密码"
                      autocomplete="new-password"
                      name="oj_register_check_password"
                    />
                  </div>
                  <OjButton :loading="registerLoading" block size="large" tone="primary" native-type="submit">
                    注册并返回登录
                  </OjButton>
                  <p class="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
                    已有账号？
                    <button
                      type="button"
                      class="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                      @click="switchAuthMode('login')"
                    >
                      返回登录
                    </button>
                  </p>
                </form>
              </div>
            </div>

            <p class="mt-4 text-center text-xs text-slate-500 dark:text-slate-500">
              登录即表示你同意
              <a href="#" class="underline-offset-2 hover:underline">服务条款</a>
              与
              <a href="#" class="underline-offset-2 hover:underline">隐私政策</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-panel.is-register {
  border-radius: 22px;
  transform: translateY(-2px) scale(1.003);
  box-shadow:
    0 2px 8px color-mix(in srgb, var(--oj-primary) 10%, transparent),
    var(--oj-shadow);
}

.auth-forms {
  position: relative;
  overflow: hidden;
  transition: height 360ms ease;
}

.auth-form-pane {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: none !important;
  will-change: opacity;
  transition: opacity 220ms ease-out;
}

.auth-form-pane.is-active {
  opacity: 1;
  pointer-events: auto;
}

.auth-form-pane.is-hidden-left,
.auth-form-pane.is-hidden-right {
  opacity: 0;
  pointer-events: none;
}

.auth-form-pane.is-hidden-left {
  transform: none !important;
}

.auth-form-pane.is-hidden-right {
  opacity: 0;
  transform: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .auth-panel,
  .auth-form-enter-active,
  .auth-form-leave-active {
    transition: none !important;
  }
}
</style>
