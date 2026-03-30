import { computed, readonly, ref } from 'vue'

export type ShellTheme = 'light' | 'dark'

const STORAGE_KEY = 'oj-shell-theme'
const theme = ref<ShellTheme>('light')

function resolveStoredTheme(): ShellTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

function applyTheme(nextTheme: ShellTheme) {
  theme.value = nextTheme

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextTheme
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }
}

export function initializeShellTheme() {
  applyTheme(resolveStoredTheme())
}

export function useShellTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(nextTheme: ShellTheme) {
    applyTheme(nextTheme)
  }

  function toggleTheme() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme: readonly(theme),
    isDark,
    setTheme,
    toggleTheme,
  }
}
