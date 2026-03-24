<script setup lang="ts">
import {
  DataLine,
  Files,
  House,
  Medal,
  Monitor,
  SwitchButton,
  UserFilled,
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

type MenuKey = '/' | '/problems' | '/contests' | '/status' | '/admin'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menuItems = [
  { key: '/', label: '控制台', icon: House },
  { key: '/problems', label: '题库', icon: Files },
  { key: '/contests', label: '比赛', icon: Medal },
  { key: '/status', label: '评测状态', icon: DataLine },
  { key: '/admin', label: '管理台', icon: Monitor },
]

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
  if (route.path.startsWith('/admin')) {
    return '/admin'
  }
  return '/'
})

function handleMenuSelect(index: string) {
  void router.push(index)
}

function handleLogout() {
  userStore.logout()
  void router.push('/login')
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar oj-panel">
      <div class="brand">
        <div class="brand-mark">OJ</div>
        <div>
          <div class="brand-title">在线评测系统</div>
          <div class="brand-subtitle">Spring Boot + Vue 3</div>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="footer-label">当前环境</div>
        <div class="footer-value">本地开发模式</div>
      </div>
    </aside>

    <div class="content">
      <header class="topbar oj-panel">
        <div>
          <div class="topbar-title">{{ route.meta.title ?? '在线评测系统' }}</div>
          <div class="topbar-subtitle">统一题库、提交、判题与教学管理入口</div>
        </div>

        <div class="topbar-actions">
          <el-tag effect="dark" type="primary">{{ userStore.roleLabel }}</el-tag>
          <div class="user-card">
            <el-icon><UserFilled /></el-icon>
            <span>{{ userStore.displayName }}</span>
          </div>
          <el-button plain @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </header>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
  gap: 18px;
  padding: 18px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px 18px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, #1456c1 0%, #3b82f6 60%, #ff7a1a 100%);
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  color: var(--oj-muted);
  font-size: 13px;
}

.menu {
  border-right: 0;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  margin-bottom: 6px;
  border-radius: 14px;
}

.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(20, 86, 193, 0.14), rgba(20, 86, 193, 0.02));
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(20, 86, 193, 0.1), rgba(249, 115, 22, 0.1));
}

.footer-label {
  color: var(--oj-muted);
  font-size: 13px;
}

.footer-value {
  margin-top: 8px;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 24px;
}

.topbar-title {
  font-size: 24px;
  font-weight: 700;
}

.topbar-subtitle {
  margin-top: 6px;
  color: var(--oj-muted);
  font-size: 14px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 40px;
  border-radius: 999px;
  background: rgba(20, 86, 193, 0.08);
  color: var(--oj-primary);
}

.main-content {
  min-width: 0;
}

@media (max-width: 1080px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding-bottom: 10px;
  }

  .sidebar-footer {
    display: none;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
