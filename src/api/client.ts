import axios from 'axios'
import { API_URL } from '../constants/config'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  // Lazy-import to avoid circular deps (authStore → client → authStore)
  const { useAuthStore } = require('../store/authStore')
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const { useAuthStore } = require('../store/authStore')
      await useAuthStore.getState().logout()
      const { router } = require('expo-router')
      router.replace('/(auth)/login')
    }
    return Promise.reject(err)
  }
)
