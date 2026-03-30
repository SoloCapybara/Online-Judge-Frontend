<script setup lang="ts">
import { SwitchButton } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import OjButton from '../ui/OjButton.vue'
import OjThemeToggle from './OjThemeToggle.vue'
import type { ShellTheme } from '../../composables/useShellTheme'
import { toAbsoluteAssetUrl } from '../../utils/url'

const props = defineProps<{
  displayName: string
  avatarUrl: string
  isLoggedIn: boolean
  roleLabel: string
  theme: ShellTheme
}>()

const emit = defineEmits<{
  toggleNav: []
  toggleTheme: []
  login: []
  register: []
  userCenter: []
  logout: []
}>()

const profileOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const avatarLoadFailed = ref(false)
const initials = computed(() => props.displayName.trim().slice(0, 1) || 'U')
const themeLabel = computed(() => (props.theme === 'dark' ? '深色模式' : '浅色模式'))
const avatarSrc = computed(() => (avatarLoadFailed.value ? '' : toAbsoluteAssetUrl(props.avatarUrl)))
const showAvatar = computed(() => avatarSrc.value.length > 0)

watch(
  () => props.avatarUrl,
  () => {
    avatarLoadFailed.value = false
  },
)

function toggleProfileCard() {
  profileOpen.value = !profileOpen.value
}

function closeProfileCard() {
  profileOpen.value = false
}

function handleLogout() {
  closeProfileCard()
  emit('logout')
}

function handleUserCenter() {
  closeProfileCard()
  emit('userCenter')
}

function handleDocumentClick(event: MouseEvent) {
  if (!profileOpen.value) {
    return
  }

  const target = event.target as Node | null
  if (!target || !profileRef.value?.contains(target)) {
    closeProfileCard()
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeProfileCard()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <header class="oj-topbar flex flex-wrap items-center gap-3 px-5 py-4 lg:flex-nowrap">
    <button
      type="button"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
      aria-label="打开菜单"
      @click="emit('toggleNav')"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <label class="order-3 flex min-w-0 flex-1 basis-full lg:order-none lg:basis-auto">
      <div class="relative w-full max-w-[420px]">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="搜索题号、标题、标签"
          autocomplete="off"
          class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-100 dark:focus:ring-indigo-500/10"
        />
      </div>
    </label>

    <div class="ml-auto flex shrink-0 items-center gap-2">
      <OjThemeToggle :is-dark="theme === 'dark'" @toggle="emit('toggleTheme')" />

      <div
        v-if="isLoggedIn"
        ref="profileRef"
        class="relative"
      >
        <button
          type="button"
          class="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-indigo-400/40 sm:flex"
          @click.stop="toggleProfileCard"
        >
          <span class="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/12 dark:text-indigo-300">
            <img
              v-if="showAvatar"
              :src="avatarSrc"
              alt="头像"
              class="h-full w-full object-cover"
              @error="avatarLoadFailed = true"
            />
            <span v-else>{{ initials }}</span>
          </span>
          <span class="font-medium">{{ displayName }}</span>
          <svg
            class="h-4 w-4 text-slate-500 transition-transform duration-200 dark:text-slate-400"
            :class="{ 'rotate-180': profileOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          class="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 sm:hidden"
          @click.stop="toggleProfileCard"
        >
          <img
            v-if="showAvatar"
            :src="avatarSrc"
            alt="头像"
            class="h-full w-full object-cover"
            @error="avatarLoadFailed = true"
          />
          <span v-else>{{ initials }}</span>
        </button>

        <transition name="profile-pop">
          <div
            v-if="profileOpen"
            class="profile-card absolute right-0 top-[calc(100%+10px)] z-40 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#12151f]/95"
          >
            <div class="flex items-start gap-3">
              <span
                class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-semibold"
                :class="
                  showAvatar
                    ? 'border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.06]'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                "
              >
                <img
                  v-if="showAvatar"
                  :src="avatarSrc"
                  alt="头像"
                  class="h-full w-full object-cover"
                  @error="avatarLoadFailed = true"
                />
                <span v-else>{{ initials }}</span>
              </span>
              <div class="min-w-0">
                <p class="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ roleLabel }}</p>
              </div>
            </div>

            <div class="mt-3 grid gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              <div class="flex items-center justify-between">
                <span>账号状态</span>
                <span class="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  在线
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span>当前主题</span>
                <span class="font-medium text-slate-800 dark:text-slate-100">{{ themeLabel }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>系统角色</span>
                <span class="font-medium text-slate-800 dark:text-slate-100">{{ roleLabel }}</span>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <OjButton block size="small" tone="ghost" @click="handleUserCenter">
                用户中心
              </OjButton>
              <OjButton block size="small" tone="secondary" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </OjButton>
            </div>
          </div>
        </transition>
      </div>

      <template v-if="!isLoggedIn">
        <OjButton size="small" tone="secondary" @click="emit('login')">登录</OjButton>
        <OjButton size="small" tone="primary" @click="emit('register')">注册</OjButton>
      </template>
    </div>
  </header>
</template>

<style scoped>
.profile-pop-enter-active,
.profile-pop-leave-active {
  transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.profile-pop-enter-from,
.profile-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
  filter: blur(3px);
}

.profile-pop-enter-to,
.profile-pop-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
</style>
