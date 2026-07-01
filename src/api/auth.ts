import { apiClient } from './client'

export interface LoginResponse {
  token: string
  user: {
    id:    number
    name:  string
    email: string
    role:  string
  }
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await apiClient.post('/api/auth/login', { email, password })
  return data
}

export const changePasswordApi = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}
