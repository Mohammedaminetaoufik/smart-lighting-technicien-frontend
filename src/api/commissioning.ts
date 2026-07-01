import { apiClient } from './client'

export const getCommissioningTasks = async (status?: string) => {
  const { data } = await apiClient.get('/api/mobile/commissioning', { params: status ? { status } : undefined })
  return data
}

export const getCommissioningTask = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/commissioning/${id}`)
  return data
}

export const commissioningUpdateGPS = async (id: number, latitude: number, longitude: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/update-gps`, { latitude, longitude })
  return data
}

export const commissioningTestComm = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/test-communication`, {})
  return data
}

export const commissioningTestDimming = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/test-dimming`, {})
  return data
}

export const commissioningValidate = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/validate`, {})
  return data
}

export const commissioningFail = async (id: number, reason: string) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/fail`, { reason })
  return data
}

export const commissioningAddNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/add-note`, { note })
  return data
}
