import { apiClient } from './client'

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
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/test`, {})
  return data
}

export const syncLCU = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/sync`, {})
  return data
}

export const addLCUFieldNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/field-note`, { note })
  return data
}

export const updateLCULocation = async (id: number, latitude: number, longitude: number, accuracy?: number) => {
  const { data } = await apiClient.post(`/api/mobile/lcus/${id}/location`, {
    latitude, longitude, accuracy: accuracy ?? 0,
  })
  return data
}
