import { computed, readonly, ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const STORAGE_KEY = 'oj-workspace-tabs'
const HIDDEN_TAB_KEYS = new Set(['/ui-demo'])

export interface WorkspaceRegistryItem {
  key: string
  title: string
  to: string
  affix?: boolean
}

export interface WorkspaceTab extends WorkspaceRegistryItem {}

const tabs = ref<WorkspaceTab[]>([])
const activeKey = ref('')

let initialized = false

function loadStoredTabs(): WorkspaceTab[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as WorkspaceTab[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((tab) => !HIDDEN_TAB_KEYS.has(tab.key))
  } catch {
    return []
  }
}

function saveTabs() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs.value))
}

function ensureInitialized() {
  if (initialized) {
    return
  }

  tabs.value = loadStoredTabs()
  initialized = true
}

function normalizeTabs() {
  const seen = new Set<string>()
  tabs.value = tabs.value.filter((tab) => {
    if (seen.has(tab.key)) {
      return false
    }

    seen.add(tab.key)
    return true
  })
}

function resolveRouteTitle(route: RouteLocationNormalizedLoaded) {
  const title = route.meta.tabTitle ?? route.meta.title ?? route.name
  return String(title ?? '页面')
}

function routeToTab(route: RouteLocationNormalizedLoaded): WorkspaceTab | null {
  if (route.path === '/login') {
    return null
  }

  return {
    key: route.fullPath,
    title: resolveRouteTitle(route),
    to: route.fullPath,
    affix: Boolean(route.meta.affix),
  }
}

export function useWorkspaceTabs() {
  ensureInitialized()

  const closableCount = computed(() => tabs.value.filter((tab) => !tab.affix).length)

  function ensurePinnedTabs(items: WorkspaceRegistryItem[]) {
    for (const item of items) {
      if (!item.affix) {
        continue
      }

      const existing = tabs.value.find((tab) => tab.key === item.key)
      if (existing) {
        existing.title = item.title
        existing.to = item.to
        existing.affix = true
        continue
      }

      tabs.value.unshift({ ...item, affix: true })
    }

    normalizeTabs()
    saveTabs()
  }

  function syncRoute(route: RouteLocationNormalizedLoaded) {
    const nextTab = routeToTab(route)
    if (!nextTab) {
      return
    }

    activeKey.value = nextTab.key

    const existing = tabs.value.find((tab) => tab.key === nextTab.key)
    if (existing) {
      existing.title = nextTab.title
      existing.to = nextTab.to
      existing.affix = nextTab.affix
    } else {
      tabs.value.push(nextTab)
    }

    normalizeTabs()
    saveTabs()
  }

  function openTab(item: WorkspaceRegistryItem) {
    const existing = tabs.value.find((tab) => tab.key === item.key)
    if (!existing) {
      tabs.value.push({ ...item })
      normalizeTabs()
      saveTabs()
    }

    activeKey.value = item.key
    return item.to
  }

  function closeTab(key: string) {
    const target = tabs.value.find((tab) => tab.key === key)
    if (!target || target.affix) {
      return null
    }

    const currentIndex = tabs.value.findIndex((tab) => tab.key === key)
    const nextTabs = tabs.value.filter((tab) => tab.key !== key)
    tabs.value = nextTabs

    if (activeKey.value === key) {
      const fallback = nextTabs[currentIndex - 1] ?? nextTabs[currentIndex] ?? nextTabs[0] ?? null
      activeKey.value = fallback?.key ?? ''
      saveTabs()
      return fallback?.to ?? null
    }

    saveTabs()
    return null
  }

  return {
    tabs: readonly(tabs),
    activeKey: readonly(activeKey),
    closableCount,
    ensurePinnedTabs,
    syncRoute,
    openTab,
    closeTab,
  }
}
