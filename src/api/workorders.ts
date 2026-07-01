import { apiClient } from './client'

export interface WorkOrderFilters {
  scope?: 'all' | 'mine' | 'available'
  status?: string
  priority?: string
  zone?: string
  limit?: number
  offset?: number
}

export const getMyWorkOrders = async (filters: WorkOrderFilters = {}) => {
  const { data } = await apiClient.get('/api/mobile/me/workorders', { params: filters })
  return data
}

export const getWorkOrder = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/workorders/${id}`)
  return data
}

export const acceptWorkOrder = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/accept`, {})
  return data
}

export const startWorkOrder = async (id: number) => {
  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/start`, {})
  return data
}

export const addNote = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/add-note`, { note })
  return data
}

export const resolveWorkOrder = async (id: number, resolutionNote: string) => {
  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/resolve`, { resolution_note: resolutionNote })
  return data
}

export const blockWorkOrder = async (id: number, note: string) => {
  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/block`, { note })
  return data
}

export const getWorkOrderPhotos = async (id: number) => {
  const { data } = await apiClient.get(`/api/mobile/workorders/${id}/photos`)
  return data
}

export const uploadWorkOrderPhoto = async (id: number, photoUri: string) => {
  const formData = new FormData()
  const uriParts = photoUri.split('/')
  const fileName = uriParts[uriParts.length - 1]
  const fileType = fileName.split('.').pop()

  // @ts-ignore
  formData.append('photo', {
    uri: photoUri,
    name: fileName,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  })

  const { data } = await apiClient.post(`/api/mobile/workorders/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
  return data
}

export const getDashboard = async () => {
  const { data } = await apiClient.get('/api/mobile/me/dashboard')
  return data
}
