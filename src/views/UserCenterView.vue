<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import OjButton from '../components/ui/OjButton.vue'
import OjInput from '../components/ui/OjInput.vue'
import OjModal from '../components/ui/OjModal.vue'
import OjSelect from '../components/ui/OjSelect.vue'
import {
  getCurrentUserProfile,
  getCurrentUserProfileStats,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  uploadUserAvatar,
  type UserPasswordUpdateRequest,
  type UserProfileUpdateRequest,
  type UserProfileVO,
  type UserProfileStatsVO,
} from '../api/user'
import { useUserStore } from '../stores/user'
import { ojMessage } from '../utils/message'
import { toAbsoluteAssetUrl } from '../utils/url'

type GenderFormValue = '0' | '1' | '2'
type ProfileForm = {
  username: string
  realName: string
  studentNo: string
  email: string
  phone: string
  avatar: string
  gender: GenderFormValue
}

const userStore = useUserStore()
const activeTab = ref<'profile' | 'password'>('profile')
const loading = ref(false)
const saving = ref(false)
const passwordSaving = ref(false)
const avatarUploading = ref(false)
const initialized = ref(false)
const avatarLoadFailed = ref(false)
const profile = ref<UserProfileVO | null>(null)
const profileStats = ref<UserProfileStatsVO>({
  solvedCount: 0,
  submitCount: 0,
  acceptedCount: 0,
  acRate: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
})

const avatarModalOpen = ref(false)
const avatarPreviewModalOpen = ref(false)
const avatarPreview = ref('')
const avatarFileInputRef = ref<HTMLInputElement | null>(null)
const avatarPendingFile = ref<File | null>(null)
const avatarPreviewObjectUrl = ref('')

const form = reactive<ProfileForm>({
  username: '',
  realName: '',
  studentNo: '',
  email: '',
  phone: '',
  avatar: '',
  gender: '0',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  checkPassword: '',
})

const solvedCount = computed(() => Number(profileStats.value?.solvedCount || 0))
const submitCount = computed(() => Number(profileStats.value?.submitCount || 0))
const streakDays = computed(() => Number(profileStats.value?.currentStreakDays || 0))
const longestStreak = computed(() => Number(profileStats.value?.longestStreakDays || 0))
const acRate = computed(() => Number(profileStats.value?.acRate || 0))
const genderOptions = [
  { label: '未知', value: '0' },
  { label: '男', value: '1' },
  { label: '女', value: '2' },
] as const

const displayName = computed(() => {
  const fromProfile = profile.value?.realName?.trim() || profile.value?.username?.trim()
  return fromProfile || userStore.displayName || '未命名用户'
})

const avatarUrl = computed(() => toAbsoluteAssetUrl(form.avatar))
const canPreviewAvatar = computed(() => Boolean(avatarUrl.value) && !avatarLoadFailed.value)
const initials = computed(() => displayName.value.slice(0, 1).toUpperCase() || 'U')
const isAdminAccount = computed(() => (profile.value?.username || '').trim().toLowerCase() === 'admin')
const canEditUsername = computed(() => !isAdminAccount.value)

const genderLabel = computed(() => {
  switch (profile.value?.gender) {
    case 0:
      return '未知'
    case 1:
      return '男'
    case 2:
      return '女'
    default:
      return '未知'
  }
})

const statusText = computed(() => {
  if (profile.value?.status === 1) {
    return '正常'
  }
  if (profile.value?.status === 0) {
    return '禁用'
  }
  return `状态 ${profile.value?.status ?? '-'}`
})

const statusPillClass = computed(() =>
  profile.value?.status === 1
    ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
)

const summaryStatusTagClass = computed(() =>
  profile.value?.status === 1
    ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
    : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
)

watch(avatarUrl, () => {
  avatarLoadFailed.value = false
})

function normalizeText(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function genderToForm(value: number | null | undefined): GenderFormValue {
  if (value === 1) return '1'
  if (value === 2) return '2'
  return '0'
}

function formToGender(value: GenderFormValue): number {
  return Number(value)
}

function applyProfile(next: UserProfileVO) {
  profile.value = next
  form.username = next.username ?? ''
  form.realName = next.realName ?? ''
  form.studentNo = next.studentNo ?? ''
  form.email = next.email ?? ''
  form.phone = next.phone ?? ''
  form.avatar = next.avatar ?? ''
  form.gender = genderToForm(next.gender)

  const nextDisplayName = next.realName?.trim() || next.username?.trim() || ''
  userStore.setDisplayName(nextDisplayName)
  userStore.setAvatar(next.avatar ?? '')
}

function resolveErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const backendMessage = (error.response?.data as { message?: string } | undefined)?.message
    return backendMessage || error.message || '请求失败，请稍后重试'
  }
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

async function loadProfile(showError = true) {
  loading.value = true
  try {
    const response = await getCurrentUserProfile()
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '获取个人信息失败')
    }
    applyProfile(response.data)
    await loadProfileStats(showError)
  } catch (error) {
    if (showError) {
      ojMessage.error(resolveErrorMessage(error))
    }
  } finally {
    initialized.value = true
    loading.value = false
  }
}

async function loadProfileStats(showError = true) {
  try {
    const response = await getCurrentUserProfileStats()
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '获取统计信息失败')
    }
    profileStats.value = response.data
  } catch (error) {
    profileStats.value = {
      solvedCount: 0,
      submitCount: 0,
      acceptedCount: 0,
      acRate: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
    }
    if (showError) {
      ojMessage.error(resolveErrorMessage(error))
    }
  }
}

function resetForm() {
  if (!profile.value) {
    return
  }
  applyProfile(profile.value)
}

async function saveProfile() {
  if (saving.value || !profile.value) {
    return
  }

  if (canEditUsername.value && !form.username.trim()) {
    ojMessage.warning('用户名不能为空')
    return
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    ojMessage.warning('邮箱格式不正确')
    return
  }

  if (form.phone && !/^[0-9+\-() ]{6,20}$/.test(form.phone.trim())) {
    ojMessage.warning('手机号格式不正确')
    return
  }

  const payload: UserProfileUpdateRequest = {
    username: canEditUsername.value ? normalizeText(form.username) : undefined,
    realName: normalizeText(form.realName),
    studentNo: normalizeText(form.studentNo),
    email: normalizeText(form.email),
    phone: normalizeText(form.phone),
    avatar: normalizeText(form.avatar),
    gender: formToGender(form.gender),
  }

  saving.value = true
  try {
    const response = await updateCurrentUserProfile(payload)
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '更新个人信息失败')
    }
    applyProfile(response.data)
    ojMessage.success('个人信息已更新')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    saving.value = false
  }
}

function resetPasswordForm() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.checkPassword = ''
}

async function updatePassword() {
  if (passwordSaving.value) {
    return
  }

  const payload: UserPasswordUpdateRequest = {
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword,
    checkPassword: passwordForm.checkPassword,
  }

  if (!payload.oldPassword || !payload.newPassword || !payload.checkPassword) {
    ojMessage.warning('请完整填写密码信息')
    return
  }

  if (payload.newPassword !== payload.checkPassword) {
    ojMessage.warning('两次新密码输入不一致')
    return
  }

  if (payload.oldPassword === payload.newPassword) {
    ojMessage.warning('新密码不能与旧密码相同')
    return
  }

  passwordSaving.value = true
  try {
    const response = await updateCurrentUserPassword(payload)
    if (response.code !== 0 || response.data !== true) {
      throw new Error(response.message || '密码修改失败')
    }
    resetPasswordForm()
    ojMessage.success('密码修改成功')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    passwordSaving.value = false
  }
}

function openAvatarModal() {
  resetAvatarSelection()
  avatarModalOpen.value = true
}

function openAvatarPreviewModal() {
  if (!canPreviewAvatar.value) {
    ojMessage.warning('暂无可预览头像')
    return
  }
  avatarPreviewModalOpen.value = true
}

function closeAvatarPreviewModal() {
  avatarPreviewModalOpen.value = false
}

function closeAvatarModal() {
  avatarModalOpen.value = false
  resetAvatarSelection()
}

function resetAvatarSelection() {
  if (avatarPreviewObjectUrl.value) {
    URL.revokeObjectURL(avatarPreviewObjectUrl.value)
    avatarPreviewObjectUrl.value = ''
  }
  avatarPendingFile.value = null
  avatarPreview.value = ''
  if (avatarFileInputRef.value) {
    avatarFileInputRef.value.value = ''
  }
}

function pickAvatarFile() {
  avatarFileInputRef.value?.click()
}

function handleAvatarFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    ojMessage.warning('图片需小于 5MB')
    return
  }

  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  if (file.type && !allowedTypes.has(file.type)) {
    ojMessage.warning('仅支持 JPG、PNG、GIF、WebP')
    return
  }

  if (avatarPreviewObjectUrl.value) {
    URL.revokeObjectURL(avatarPreviewObjectUrl.value)
  }
  avatarPreviewObjectUrl.value = URL.createObjectURL(file)
  avatarPreview.value = avatarPreviewObjectUrl.value
  avatarPendingFile.value = file
}

async function applyAvatar() {
  if (!avatarPendingFile.value || avatarUploading.value) {
    return
  }

  avatarUploading.value = true
  try {
    const response = await uploadUserAvatar(avatarPendingFile.value)
    if (response.code !== 0 || !response.data) {
      throw new Error(response.message || '头像上传失败')
    }
    applyProfile(response.data)
    closeAvatarModal()
    ojMessage.success('头像已上传')
  } catch (error) {
    ojMessage.error(resolveErrorMessage(error))
  } finally {
    avatarUploading.value = false
  }
}

onMounted(() => {
  void loadProfile(false)
})

onBeforeUnmount(() => {
  if (avatarPreviewObjectUrl.value) {
    URL.revokeObjectURL(avatarPreviewObjectUrl.value)
  }
})
</script>

<template>
  <section class="oj-user-center mx-auto w-full max-w-5xl">
    <div v-if="loading && !initialized" class="grid min-h-[320px] place-items-center text-sm text-slate-500 dark:text-slate-400">
      正在加载个人信息...
    </div>

    <div v-else-if="!profile" class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">个人信息加载失败</h2>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">请检查登录状态或稍后重试。</p>
      <OjButton tone="secondary" class="mt-5" @click="loadProfile()">
        重新加载
      </OjButton>
    </div>

    <template v-else>
      <section class="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/80 p-6 shadow-card ring-1 ring-slate-200/50 dark:border-white/[0.08] dark:from-[#12151f] dark:via-[#12151f] dark:to-[#181c2a]/90 dark:shadow-card-dark dark:ring-white/[0.04]">
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15"></div>
        <div class="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/12"></div>

        <div class="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <div class="relative shrink-0">
            <div
              class="group relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-lg transition hover:border-violet-400/60 dark:border-white/10 dark:bg-[#181c2a]"
            >
              <img
                v-if="avatarUrl && !avatarLoadFailed"
                :src="avatarUrl"
                alt="头像"
                width="88"
                height="88"
                class="h-full w-full object-cover"
                @error="avatarLoadFailed = true"
              />
              <div
                v-else
                class="absolute inset-0 grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-semibold text-white"
              >
                {{ initials }}
              </div>
              <div class="absolute inset-0 flex items-end justify-center bg-slate-900/0 p-2 transition group-hover:bg-slate-900/45 group-focus-within:bg-slate-900/45">
                <div class="flex translate-y-2 gap-1.5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <button
                    type="button"
                    :disabled="!canPreviewAvatar"
                    class="rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-800 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#181c2a]/95 dark:text-slate-100 dark:hover:bg-[#23293a]"
                    @click="openAvatarPreviewModal"
                  >
                    预览
                  </button>
                  <button
                    type="button"
                    class="rounded-md bg-violet-600/95 px-2 py-1 text-[11px] font-medium text-white shadow-sm transition hover:bg-violet-500"
                    @click="openAvatarModal"
                  >
                    更换
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{{ displayName }}</h2>
              <span class="rounded-md border px-2 py-0.5 text-xs font-semibold" :class="statusPillClass">
                账号状态：{{ statusText }}
              </span>
            </div>
            <dl class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div class="flex items-center gap-2">
                <dt class="text-slate-500 dark:text-slate-500">角色</dt>
                <dd>
                  <span class="rounded-md bg-violet-500/10 px-2 py-0.5 font-medium text-violet-800 dark:text-violet-300">
                    {{ userStore.roleLabel }}
                  </span>
                </dd>
              </div>
              <div class="flex items-center gap-2">
                <dt class="text-slate-500 dark:text-slate-500">用户名</dt>
                <dd class="font-mono text-slate-800 dark:text-slate-200">{{ profile.username || '-' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-violet-300/40 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark dark:hover:border-violet-500/25">
          <div class="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">已通过题目</div>
          <div class="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{{ solvedCount }}</div>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-500">评测通过的去重题数 · AC率 {{ acRate.toFixed(2) }}%</p>
        </article>

        <article class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-violet-300/40 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark dark:hover:border-violet-500/25">
          <div class="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
          </div>
          <div class="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">总提交次数</div>
          <div class="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{{ submitCount.toLocaleString('zh-CN') }}</div>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-500">含评测中与各结果</p>
        </article>

        <article class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-violet-300/40 hover:shadow-lg dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark dark:hover:border-violet-500/25">
          <div class="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <div class="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">连续打卡</div>
          <div class="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {{ streakDays }}<span class="ml-0.5 text-base font-medium text-slate-500 dark:text-slate-400">天</span>
          </div>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-500">最长连续 {{ longestStreak }} 天</p>
        </article>
      </section>

      <div class="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_340px] xl:items-start xl:gap-10">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-white/[0.08] dark:bg-[#12151f] dark:shadow-card-dark sm:p-8">
          <div class="mb-6 border-b border-slate-200 pb-4 dark:border-white/[0.06]">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">账户设置</h3>
              <div class="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-[#181c2a]">
                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                  :class="activeTab === 'profile'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#23293a] dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
                  @click="activeTab = 'profile'"
                >
                  基础信息
                </button>
                <button
                  type="button"
                  class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                  :class="activeTab === 'password'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#23293a] dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'"
                  @click="activeTab = 'password'"
                >
                  修改密码
                </button>
              </div>
            </div>
          </div>

          <form v-if="activeTab === 'profile'" class="space-y-5" @submit.prevent="saveProfile">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
                <OjInput
                  v-model="form.username"
                  :disabled="!canEditUsername"
                  placeholder="请输入用户名"
                  class="w-full"
                />
                <p v-if="!canEditUsername" class="mt-1 text-xs text-slate-500 dark:text-slate-500">系统内置 admin 账号用户名不可修改</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">用户 ID</label>
                <OjInput
                  :model-value="profile.id"
                  disabled
                  class="w-full"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">真实姓名</label>
                <OjInput
                  v-model="form.realName"
                  placeholder="请输入真实姓名"
                  class="w-full"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">学号</label>
                <OjInput
                  v-model="form.studentNo"
                  placeholder="请输入学号（选填）"
                  class="w-full"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
                <OjInput
                  v-model="form.email"
                  type="text"
                  autocomplete="email"
                  placeholder="name@example.com"
                  class="w-full"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">手机号</label>
                <OjInput
                  v-model="form.phone"
                  type="text"
                  autocomplete="tel"
                  placeholder="请输入手机号（选填）"
                  class="w-full"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">性别</label>
                <OjSelect
                  v-model="form.gender"
                  :options="genderOptions"
                  placeholder="请选择性别"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">头像地址</label>
                <OjInput
                  :model-value="form.avatar"
                  disabled
                  class="w-full"
                />
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-500">头像请通过上方头像区域的“更换头像”上传</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-2">
              <OjButton
                tone="primary"
                native-type="submit"
                :loading="saving"
                :disabled="saving"
              >
                {{ saving ? '保存中...' : '保存并同步' }}
              </OjButton>
              <OjButton
                tone="secondary"
                :disabled="saving"
                @click="resetForm"
              >
                重置
              </OjButton>
            </div>
          </form>

          <form v-else class="max-w-xl space-y-5" @submit.prevent="updatePassword">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">当前密码</label>
              <OjInput
                v-model="passwordForm.oldPassword"
                type="password"
                autocomplete="current-password"
                placeholder="请输入当前密码"
                show-password
                class="w-full"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">新密码</label>
              <OjInput
                v-model="passwordForm.newPassword"
                type="password"
                autocomplete="new-password"
                placeholder="请输入新密码"
                show-password
                class="w-full"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">确认新密码</label>
              <OjInput
                v-model="passwordForm.checkPassword"
                type="password"
                autocomplete="new-password"
                placeholder="请再次输入新密码"
                show-password
                class="w-full"
              />
            </div>

            <p class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-[#181c2a] dark:text-slate-400">
              密码修改成功后，将在下次登录时生效。请妥善保管新密码。
            </p>

            <div class="flex flex-wrap items-center gap-3 pt-2">
              <OjButton
                tone="primary"
                native-type="submit"
                :loading="passwordSaving"
                :disabled="passwordSaving"
              >
                {{ passwordSaving ? '提交中...' : '更新密码' }}
              </OjButton>
              <OjButton
                tone="secondary"
                :disabled="passwordSaving"
                @click="resetPasswordForm"
              >
                清空
              </OjButton>
            </div>
          </form>
        </section>

        <aside class="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#181c2a]/80 sm:p-6">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">账号摘要</h3>
          <dl class="mt-6 space-y-4 text-sm">
            <div class="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <dt class="text-slate-500 dark:text-slate-500">姓名</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">{{ profile.realName || '未设置' }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <dt class="text-slate-500 dark:text-slate-500">性别</dt>
              <dd class="text-slate-600 dark:text-slate-300">{{ genderLabel }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <dt class="text-slate-500 dark:text-slate-500">邮箱</dt>
              <dd class="text-slate-600 dark:text-slate-300">{{ profile.email || '未设置' }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <dt class="text-slate-500 dark:text-slate-500">手机号</dt>
              <dd class="text-slate-600 dark:text-slate-300">{{ profile.phone || '未设置' }}</dd>
            </div>
            <div class="flex justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-white/[0.06]">
              <dt class="text-slate-500 dark:text-slate-500">学号</dt>
              <dd class="text-slate-600 dark:text-slate-300">{{ profile.studentNo || '未设置' }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500 dark:text-slate-500">账号状态</dt>
              <dd>
                <span class="rounded-md px-2 py-0.5 text-xs font-semibold" :class="summaryStatusTagClass">{{ statusText }}</span>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </section>

  <OjModal
    v-model="avatarModalOpen"
    title="更换头像"
    description="支持 JPG、PNG、GIF、WebP，建议小于 5MB。"
    max-width="28rem"
    @close="closeAvatarModal"
  >
    <div class="mx-auto flex aspect-square max-h-[240px] w-full max-w-[240px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-[#0c0e14]">
      <img v-if="avatarPreview" :src="avatarPreview" alt="预览头像" class="max-h-full max-w-full object-contain" />
      <span v-else class="px-4 text-center text-sm text-slate-400 dark:text-slate-500">尚未选择图片</span>
    </div>

    <input
      ref="avatarFileInputRef"
      type="file"
      class="hidden"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleAvatarFileChange"
    />

    <div class="mt-5 flex flex-wrap gap-2">
      <OjButton
        tone="secondary"
        :disabled="avatarUploading"
        @click="pickAvatarFile"
      >
        {{ avatarUploading ? '上传中...' : '选择图片' }}
      </OjButton>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <OjButton
          tone="secondary"
          size="small"
          :disabled="avatarUploading"
          @click="closeAvatarModal"
        >
          取消
        </OjButton>
        <OjButton
          tone="primary"
          size="small"
          :loading="avatarUploading"
          :disabled="!avatarPendingFile || avatarUploading"
          @click="applyAvatar"
        >
          {{ avatarUploading ? '上传中...' : '应用' }}
        </OjButton>
      </div>
    </template>
  </OjModal>

  <OjModal
    v-model="avatarPreviewModalOpen"
    title="头像预览"
    max-width="44rem"
    @close="closeAvatarPreviewModal"
  >
    <div class="mx-auto flex min-h-[320px] max-h-[72vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#0c0e14]">
      <img
        v-if="canPreviewAvatar"
        :src="avatarUrl"
        alt="头像预览"
        class="max-h-[72vh] w-auto max-w-full object-contain"
      />
      <span v-else class="px-4 text-sm text-slate-500 dark:text-slate-400">暂无可预览头像</span>
    </div>
  </OjModal>
</template>
