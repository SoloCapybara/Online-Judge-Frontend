import axios from 'axios'
import { finishRequestProgress, startRequestProgress } from '../composables/useRouteProgress'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

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
    return response.data
  },
  (error) => {
    finishRequestProgress()
    return Promise.reject(error)
  },
)

export default request
