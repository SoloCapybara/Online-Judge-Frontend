<script setup lang="ts">
import {
  ChatDotRound,
  DataLine,
  Files,
  House,
  Medal,
  Monitor,
  QuestionFilled,
  Tickets,
} from '@element-plus/icons-vue'
import { computed, ref, type Component, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OjSidebar from '../components/layout/OjSidebar.vue'
import OjTopbar from '../components/layout/OjTopbar.vue'
import OjWorkspaceTabs from '../components/layout/OjWorkspaceTabs.vue'
import OjButton from '../components/ui/OjButton.vue'
import OjModal from '../components/ui/OjModal.vue'
import { logoutUser } from '../api/auth'
import { useShellLayout } from '../composables/useShellLayout'
import { useShellTheme } from '../composables/useShellTheme'
import { useWorkspaceTabs, type WorkspaceRegistryItem } from '../composables/useWorkspaceTabs'
import { useUserStore, type UserRole } from '../stores/user'
import { ojMessage } from '../utils/message'

type MenuKey =
  | '/'
  | '/problems'
  | '/contests'
  | '/submissions'
  | '/status'
  | '/rank'
  | '/user-center'
  | '/discuss'
  | '/help'
  | '/teacher'
  | '/admin'
type MenuItem = {
  key: MenuKey
  label: string
  icon: Component
  roles: UserRole[]
  section: '练习' | '社区' | '工作台'
  affix?: boolean
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const { collapsed, drawerOpen, closeDrawer, toggleNavigation } = useShellLayout()
const { theme, toggleTheme } = useShellTheme()
const {
  tabs,
  activeKey: activeTabKey,
  ensurePinnedTabs,
  syncRoute,
  openTab,
  closeTab,
} = useWorkspaceTabs()

const viewRefreshSeed = ref(0)
const logoutConfirmOpen = ref(false)
const logoutLoading = ref(false)

const menuItems: MenuItem[] = [
  { key: '/', label: '首页', icon: House, roles: ['student', 'teacher', 'admin'], section: '练习', affix: true },
  { key: '/problems', label: '题库', icon: Files, roles: ['student', 'teacher', 'admin'], section: '练习' },
  { key: '/contests', label: '比赛', icon: Medal, roles: ['student', 'teacher', 'admin'], section: '练习' },
  { key: '/submissions', label: '提交记录', icon: Tickets, roles: ['student', 'teacher', 'admin'], section: '练习' },
  { key: '/status', label: '评测状态', icon: DataLine, roles: ['student', 'teacher', 'admin'], section: '练习' },
  { key: '/rank', label: '排行榜', icon: Medal, roles: ['student', 'teacher', 'admin'], section: '练习' },
  { key: '/discuss', label: '讨论区', icon: ChatDotRound, roles: ['student', 'teacher', 'admin'], section: '社区' },
  { key: '/help', label: '帮助 / FAQ', icon: QuestionFilled, roles: ['student', 'teacher', 'admin'], section: '社区' },
  { key: '/teacher', label: '教师工作台', icon: Tickets, roles: ['teacher'], section: '工作台' },
  { key: '/admin', label: '管理台', icon: Monitor, roles: ['admin'], section: '工作台' },
]

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => item.roles.includes(userStore.role)),
)

const sidebarSections = computed(() => {
  const orderedSections: Array<MenuItem['section']> = ['练习', '社区', '工作台']

  return orderedSections
    .map((section) => ({
      label: section,
      items: visibleMenuItems.value
        .filter((item) => item.section === section)
        .map(({ key, label, icon }) => ({ key, label, icon })),
    }))
    .filter((section) => section.items.length > 0)
})

const tabRegistry = computed<WorkspaceRegistryItem[]>(() =>
  visibleMenuItems.value.map((item) => ({
    key: item.key,
    title: item.label,
    to: item.key,
    affix: item.affix,
  })),
)

const activeMenu = computed<MenuKey>(() => {
  if (route.path.startsWith('/problems')) {
    return '/problems'
  }
  if (route.path.startsWith('/contests')) {
    return '/contests'
  }
  if (route.path.startsWith('/status')) {
    return '/status'
  }
  if (route.path.startsWith('/submissions')) {
    return '/submissions'
  }
  if (route.path.startsWith('/rank')) {
    return '/rank'
  }
  if (route.path.startsWith('/user-center')) {
    return '/user-center'
  }
  if (route.path.startsWith('/discuss')) {
    return '/discuss'
  }
  if (route.path.startsWith('/help')) {
    return '/help'
  }
  if (route.path.startsWith('/teacher')) {
    return '/teacher'
  }
  if (route.path.startsWith('/admin')) {
    return '/admin'
  }
  return '/'
})

const shellStyle = computed(() => ({
  '--shell-sidebar-width': collapsed.value ? '72px' : '260px',
}))

const routerViewKey = computed(() => `${route.fullPath}::${viewRefreshSeed.value}`)

watch(
  tabRegistry,
  (items) => {
    ensurePinnedTabs(items.filter((item) => item.affix))
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    syncRoute(route)
    closeDrawer()
  },
  { immediate: true },
)

function handleMenuSelect(index: string) {
  closeDrawer()
  void router.push(index)
}

function handleTabNavigate(to: string) {
  closeDrawer()
  void router.push(to)
}

function handleTabOpen(key: string) {
  const target = tabRegistry.value.find((item) => item.key === key)
  if (!target) {
    return
  }

  const nextTo = openTab(target)
  closeDrawer()
  void router.push(nextTo)
}

function handleTabClose(key: string) {
  const fallbackTo = closeTab(key)
  if (fallbackTo && fallbackTo !== route.fullPath) {
    void router.push(fallbackTo)
  }
}

function handleRefresh() {
  viewRefreshSeed.value += 1
}

function handleLogout() {
  if (logoutLoading.value) {
    return
  }
  logoutConfirmOpen.value = true
}

async function confirmLogout() {
  if (logoutLoading.value) {
    return
  }

  logoutLoading.value = true
  let remoteLogoutFailed = false
  try {
    const response = await logoutUser()
    if (response.code !== 0 || response.data !== true) {
      remoteLogoutFailed = true
    }
  } catch {
    remoteLogoutFailed = true
  } finally {
    logoutLoading.value = false
    logoutConfirmOpen.value = false
  }

  userStore.logout()
  closeDrawer()
  await router.push('/login')

  if (remoteLogoutFailed) {
    ojMessage.warning('服务端退出失败，已清理本地登录状态')
    return
  }
  ojMessage.success('已退出登录')
}

function handleLoginEntry() {
  closeDrawer()
  void router.push('/login')
}

function handleRegisterEntry() {
  closeDrawer()
  void router.push('/login?mode=register')
}

function handleUserCenterEntry() {
  closeDrawer()
  void router.push('/user-center')
}
</script>

<template>
  <div class="shell" :style="shellStyle">
    <button
      type="button"
      class="shell__overlay"
      :class="{ 'is-visible': drawerOpen }"
      aria-label="关闭侧边栏"
      @click="closeDrawer"
    ></button>

    <OjSidebar
      title="CodeArena"
      subtitle="在线评测"
      :active-key="activeMenu"
      :sections="sidebarSections"
      :collapsed="collapsed"
      :drawer-open="drawerOpen"
      @select="handleMenuSelect"
      @toggle-collapse="toggleNavigation"
    />

    <div class="content">
      <div class="shell__header">
        <OjTopbar
          :display-name="userStore.displayName"
          :avatar-url="userStore.avatar"
          :is-logged-in="userStore.isLoggedIn"
          :role-label="userStore.roleLabel"
          :theme="theme"
          @toggle-nav="toggleNavigation"
          @toggle-theme="toggleTheme"
          @login="handleLoginEntry"
          @register="handleRegisterEntry"
          @user-center="handleUserCenterEntry"
          @logout="handleLogout"
        />

        <OjWorkspaceTabs
          :tabs="tabs"
          :active-key="activeTabKey"
          :openable-items="tabRegistry"
          @navigate="handleTabNavigate"
          @open="handleTabOpen"
          @close="handleTabClose"
          @refresh="handleRefresh"
        />
      </div>

      <main class="main-content">
        <router-view :key="routerViewKey" />
      </main>
    </div>

    <OjModal
      v-model="logoutConfirmOpen"
      title="确认退出登录"
      description="退出后将清除当前设备的登录状态。"
      max-width="26rem"
      :close-on-esc="!logoutLoading"
      :close-on-overlay="!logoutLoading"
      :show-close="!logoutLoading"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        确定要退出当前账号吗？
      </p>

      <template #footer>
        <div class="flex justify-end gap-2">
          <OjButton
            tone="secondary"
            size="small"
            :disabled="logoutLoading"
            @click="logoutConfirmOpen = false"
          >
            取消
          </OjButton>
          <OjButton
            tone="danger"
            size="small"
            :loading="logoutLoading"
            @click="confirmLogout"
          >
            确认退出
          </OjButton>
        </div>
      </template>
    </OjModal>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: var(--shell-sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  will-change: grid-template-columns;
  transition: grid-template-columns 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 34;
  border: 0;
  background: rgba(15, 23, 42, 0.38);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.shell__overlay.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.content {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
}

.shell__header {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(8px);
  background: var(--oj-shell-header-bg);
  border-bottom: 1px solid var(--oj-shell-header-border);
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 960px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shell,
  .shell__overlay {
    transition: none !important;
  }
}
</style>
