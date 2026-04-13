import axios from 'axios'
import { finishRequestProgress, startRequestProgress } from '../composables/useRouteProgress'
import { ojMessage } from './message'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

const authClient = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

const AUTH_INVALID_CODE = 40100
let handlingAuthInvalid = false

function clearLocalSession() {
  localStorage.removeItem('oj-token')
  localStorage.removeItem('oj-role')
  localStorage.removeItem('oj-user-id')
  localStorage.removeItem('oj-username')
  localStorage.removeItem('oj-display-name')
  localStorage.removeItem('oj-avatar')
}

function shouldSkipGlobalAuthHandle(url?: string) {
  const path = String(url ?? '')
  return path.includes('/auth/login') || path.includes('/auth/register')
}

async function handleAuthInvalid(message?: string) {
  if (handlingAuthInvalid) {
    return
  }
  handlingAuthInvalid = true

  try {
    const token = localStorage.getItem('oj-token')
    if (token) {
      try {
        await authClient.post('/auth/logout', null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch {
        // Ignore remote logout failure; local cleanup is still required.
      }
    }

    clearLocalSession()
    ojMessage.warning(message || '登录状态无效，请重新登录')

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
  } finally {
    setTimeout(() => {
      handlingAuthInvalid = false
    }, 300)
  }
}

request.interceptors.request.use((config) => {
  startRequestProgress()
  const token = localStorage.getItem('oj-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  finishRequestProgress()
  return Promise.reject(error)
})

request.interceptors.response.use(
  (response) => {
    finishRequestProgress()
    const body = response.data as { code?: number; message?: string } | undefined
    const url = response.config?.url
    if (body?.code === AUTH_INVALID_CODE && !shouldSkipGlobalAuthHandle(url)) {
      void handleAuthInvalid(body.message)
      return Promise.reject(new Error(body.message || '登录状态无效'))
    }
    return response.data
  },
  (error) => {
    finishRequestProgress()
    const status = Number(error?.response?.status)
    const url = error?.config?.url as string | undefined
    const responseMessage = (error?.response?.data as { message?: string } | undefined)?.message
    if (status === 401 && !shouldSkipGlobalAuthHandle(url)) {
      void handleAuthInvalid(responseMessage || '登录状态无效')
    }
    return Promise.reject(error)
  },
)

export default request
