import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type UserRole = 'student' | 'teacher' | 'admin'

function resolveStoredPermissions(value: string | null): string[] {
  if (!value) {
    return []
  }
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  } catch {
    return []
  }
}

function resolveStoredRole(value: string | null): UserRole {
  if (value === 'teacher' || value === 'admin' || value === 'student') {
    return value
  }

  return 'student'
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('oj-token') ?? '')
  const role = ref<UserRole>(resolveStoredRole(localStorage.getItem('oj-role')))
  const userId = ref(localStorage.getItem('oj-user-id') ?? '')
  const username = ref(localStorage.getItem('oj-username') ?? '')
  const displayName = ref(localStorage.getItem('oj-display-name') ?? '')
  const avatar = ref(localStorage.getItem('oj-avatar') ?? '')
  const permissionCodes = ref<string[]>(resolveStoredPermissions(localStorage.getItem('oj-permission-codes')))

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

  function setSession(
    nextToken: string,
    nextRole: UserRole,
    nextDisplayName: string,
    nextAvatar = '',
    nextUserId = '',
    nextUsername = '',
    nextPermissionCodes: string[] = [],
  ) {
    token.value = nextToken
    role.value = nextRole
    userId.value = nextUserId
    username.value = nextUsername
    displayName.value = nextDisplayName
    avatar.value = nextAvatar
    permissionCodes.value = nextPermissionCodes
    localStorage.setItem('oj-token', token.value)
    localStorage.setItem('oj-role', role.value)
    if (userId.value) {
      localStorage.setItem('oj-user-id', userId.value)
    } else {
      localStorage.removeItem('oj-user-id')
    }
    if (username.value) {
      localStorage.setItem('oj-username', username.value)
    } else {
      localStorage.removeItem('oj-username')
    }
    localStorage.setItem('oj-display-name', displayName.value)
    if (avatar.value) {
      localStorage.setItem('oj-avatar', avatar.value)
    } else {
      localStorage.removeItem('oj-avatar')
    }
    localStorage.setItem('oj-permission-codes', JSON.stringify(permissionCodes.value))
  }

  function login(nextRole: UserRole, nextDisplayName = '邓旭东', nextAvatar = '') {
    setSession(`mock-token-${nextRole}`, nextRole, nextDisplayName, nextAvatar, '', '', [])
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
    userId.value = ''
    username.value = ''
    displayName.value = ''
    avatar.value = ''
    permissionCodes.value = []
    localStorage.removeItem('oj-token')
    localStorage.removeItem('oj-role')
    localStorage.removeItem('oj-user-id')
    localStorage.removeItem('oj-username')
    localStorage.removeItem('oj-display-name')
    localStorage.removeItem('oj-avatar')
    localStorage.removeItem('oj-permission-codes')
  }

  return {
    token,
    role,
    userId,
    username,
    displayName,
    avatar,
    permissionCodes,
    isLoggedIn,
    roleLabel,
    setSession,
    setDisplayName,
    setAvatar,
    login,
    logout,
  }
})
