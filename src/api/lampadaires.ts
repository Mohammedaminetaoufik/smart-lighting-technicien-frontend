import { apiClient } from './client'

export const getLampadaires = async (filters?: { zone?: string; etat?: string; search?: string }) => {
  const { data } = await apiClient.get('/api/mobile/lampadaires', { params: filters })
  return data
}

export const getLampadaireDetails = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lampadaires/${id}/details`)
  return data
}

export const getLampadaireAlerts = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lampadaires/${id}/alerts`)
  return data
}

export const getLampadaireWorkOrders = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/lampadaires/${id}/workorders`)
  return data
}

export const addLampadaireFieldNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/lampadaires/${id}/field-note`, { note })
  return data
}

export const updateLampadaireLocation = async (id: number, latitude: number, longitude: number, accuracy?: number) => {
  const { data } = await apiClient.post(`/api/mobile/lampadaires/${id}/location`, {
    latitude, longitude, accuracy: accuracy ?? 0, source: 'technician_mobile',
  })
  return data
}
