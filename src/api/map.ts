import { apiClient } from './client'
import { DEFAULT_TECHNICIAN_ID } from '../constants/config'

export const getTechnicianContext = async (params?: {
  latitude?: number; longitude?: number; radius?: number
}) => {
  const { data } = await apiClient.get('/api/map/technician-context', {
    params: {
      technician_id: DEFAULT_TECHNICIAN_ID,
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

// Lecture seule — pas de dimming, pas d'ajout de LCU
// La mise à jour GPS reste disponible pour le technicien terrain
export const updateLampadaireLocation = async (
  id: number, latitude: number, longitude: number, accuracy?: number
) => {
  const { data } = await apiClient.post(`/api/map/lampadaires/${id}/location`, {
    latitude, longitude, accuracy: accuracy ?? 0, source: 'technician_mobile',
  })
  return data
}
