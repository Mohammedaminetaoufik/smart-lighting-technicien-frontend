import { apiClient } from './client'

export const getTechnicianContext = async (params?: {
  latitude?: number; longitude?: number; radius?: number
}) => {
  const { data } = await apiClient.get('/api/map/technician-context', {
    params: {
      include_lcus: true,
      include_connections: true,
      ...params,
    },
  })
  return data
}

export const getMapLampadaires = async (filters?: {
  zone?: string; etat?: string; lcu_id?: number
}) => {
  const { data } = await apiClient.get('/api/map/lampadaires', { params: filters })
  return data
}

export const getMapLCUs = async () => {
  const { data } = await apiClient.get('/api/map/lcus')
  return data
}

export const getMapConnections = async (lcuId?: number) => {
  const { data } = await apiClient.get('/api/map/connections', {
    params: lcuId ? { lcu_id: lcuId } : undefined,
  })
  return data
}

export const getMissingLocation = async () => {
  const { data } = await apiClient.get('/api/map/lampadaires/missing-location')
  return data
}

export const updateLampadaireLocation = async (
  id: number, latitude: number, longitude: number, accuracy?: number
) => {
  const { data } = await apiClient.post(`/api/map/lampadaires/${id}/location`, {
    latitude, longitude, accuracy: accuracy ?? 0, source: 'technician_mobile',
  })
  return data
}
