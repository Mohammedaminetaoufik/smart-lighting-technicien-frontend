import { apiClient } from './client'
import { DEFAULT_TECHNICIAN_ID } from '../constants/config'

const tid = () => ({ technician_id: DEFAULT_TECHNICIAN_ID })

export const getCommissioningTasks = async (status?: string) => {
  const { data } = await apiClient.get('/api/mobile/commissioning', { params: status ? { status } : undefined })
  return data
}

export const getCommissioningTask = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/commissioning/${id}`)
  return data
}

export const commissioningUpdateGPS = async (id: number, latitude: number, longitude: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/update-gps`, { ...tid(), latitude, longitude })
  return data
}

export const commissioningTestComm = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/test-communication`, tid())
  return data
}

export const commissioningTestDimming = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/test-dimming`, tid())
  return data
}

export const commissioningValidate = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/validate`, tid())
  return data
}

export const commissioningFail = async (id: number, reason: string) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/fail`, { ...tid(), reason })
  return data
}

export const commissioningAddNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/commissioning/${id}/add-note`, { ...tid(), note })
  return data
}
