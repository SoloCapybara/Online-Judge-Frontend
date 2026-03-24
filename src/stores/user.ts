import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type UserRole = 'student' | 'teacher' | 'admin'

function resolveStoredRole(value: string | null): UserRole {
  if (value === 'teacher' || value === 'admin' || value === 'student') {
    return value
  }

  return 'student'
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('oj-token') ?? '')
  const role = ref<UserRole>(resolveStoredRole(localStorage.getItem('oj-role')))
  const displayName = ref(localStorage.getItem('oj-display-name') ?? '邓旭东')

  const isLoggedIn = computed(() => token.value.length > 0)
  const roleLabel = computed(() => {
    switch (role.value) {
      case 'teacher':
        return '教师'
      case 'admin':
        return '管理员'
      default:
        return '学生'
    }
  })

  function login(nextRole: UserRole, nextDisplayName = '邓旭东') {
    role.value = nextRole
    token.value = `mock-token-${nextRole}`
    displayName.value = nextDisplayName
    localStorage.setItem('oj-token', token.value)
    localStorage.setItem('oj-role', role.value)
    localStorage.setItem('oj-display-name', displayName.value)
  }

  function logout() {
    token.value = ''
    role.value = 'student'
    displayName.value = '邓旭东'
    localStorage.removeItem('oj-token')
    localStorage.removeItem('oj-role')
    localStorage.removeItem('oj-display-name')
  }

  return {
    token,
    role,
    displayName,
    isLoggedIn,
    roleLabel,
    login,
    logout,
  }
})
