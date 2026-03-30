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
  const displayName = ref(localStorage.getItem('oj-display-name') ?? '')
  const avatar = ref(localStorage.getItem('oj-avatar') ?? '')

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

  function setSession(nextToken: string, nextRole: UserRole, nextDisplayName: string, nextAvatar = '') {
    token.value = nextToken
    role.value = nextRole
    displayName.value = nextDisplayName
    avatar.value = nextAvatar
    localStorage.setItem('oj-token', token.value)
    localStorage.setItem('oj-role', role.value)
    localStorage.setItem('oj-display-name', displayName.value)
    if (avatar.value) {
      localStorage.setItem('oj-avatar', avatar.value)
    } else {
      localStorage.removeItem('oj-avatar')
    }
  }

  function login(nextRole: UserRole, nextDisplayName = '邓旭东', nextAvatar = '') {
    setSession(`mock-token-${nextRole}`, nextRole, nextDisplayName, nextAvatar)
  }

  function setDisplayName(nextDisplayName: string) {
    displayName.value = nextDisplayName
    if (nextDisplayName) {
      localStorage.setItem('oj-display-name', nextDisplayName)
    } else {
      localStorage.removeItem('oj-display-name')
    }
  }

  function setAvatar(nextAvatar: string) {
    avatar.value = nextAvatar
    if (nextAvatar) {
      localStorage.setItem('oj-avatar', nextAvatar)
    } else {
      localStorage.removeItem('oj-avatar')
    }
  }

  function logout() {
    token.value = ''
    role.value = 'student'
    displayName.value = ''
    avatar.value = ''
    localStorage.removeItem('oj-token')
    localStorage.removeItem('oj-role')
    localStorage.removeItem('oj-display-name')
    localStorage.removeItem('oj-avatar')
  }

  return {
    token,
    role,
    displayName,
    avatar,
    isLoggedIn,
    roleLabel,
    setSession,
    setDisplayName,
    setAvatar,
    login,
    logout,
  }
})
