import { readonly, ref } from 'vue'

const STORAGE_KEY = 'oj-shell-sidebar-collapsed'
const MOBILE_BREAKPOINT = 960

const collapsed = ref(false)
const drawerOpen = ref(false)
const isMobile = ref(false)

let initialized = false

function resolveStoredCollapsed() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

function syncViewportMode() {
  if (typeof window === 'undefined') {
    return
  }

  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
  if (!isMobile.value) {
    drawerOpen.value = false
  }
}

function persistCollapsed(nextValue: boolean) {
  collapsed.value = nextValue

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextValue ? '1' : '0')
  }
}

function initializeShellLayout() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  collapsed.value = resolveStoredCollapsed()
  syncViewportMode()
  window.addEventListener('resize', syncViewportMode)
  initialized = true
}

export function useShellLayout() {
  initializeShellLayout()

  function setCollapsed(nextValue: boolean) {
    persistCollapsed(nextValue)
  }

  function toggleNavigation() {
    if (isMobile.value) {
      drawerOpen.value = !drawerOpen.value
      return
    }

    persistCollapsed(!collapsed.value)
  }

  function openDrawer() {
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  return {
    collapsed: readonly(collapsed),
    drawerOpen: readonly(drawerOpen),
    isMobile: readonly(isMobile),
    setCollapsed,
    toggleNavigation,
    openDrawer,
    closeDrawer,
  }
}
