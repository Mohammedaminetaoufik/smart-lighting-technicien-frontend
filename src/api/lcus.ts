import { apiClient } from './client'
import { DEFAULT_TECHNICIAN_ID } from '../constants/config'

export const getLCUs = async () => {
  const { data } = await apiClient.get('/api/mobile/lcus')
  return data
}

export const getLCUDetails = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lcus/${id}/details`)
  return data
}

export const getLCULampadaires = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lcus/${id}/lampadaires`)
  return data
}

export const getLCUDiagnostic = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lcus/${id}/diagnostic`)
  return data
}

export const testLCU = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/test`, { technician_id: DEFAULT_TECHNICIAN_ID })
  return data
}

export const syncLCU = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/sync`, { technician_id: DEFAULT_TECHNICIAN_ID })
  return data
}

export const addLCUFieldNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/field-note`, {
    technician_id: DEFAULT_TECHNICIAN_ID, note,
  })
  return data
}

export const updateLCULocation = async (id: number, latitude: number, longitude: number, accuracy?: number) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/location`, {
    technician_id: DEFAULT_TECHNICIAN_ID, latitude, longitude, accuracy: accuracy ?? 0,
  })
  return data
}
