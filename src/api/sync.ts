import { apiClient } from './client'
import { DEFAULT_TECHNICIAN_ID } from '../constants/config'
import type { SyncAction } from '../store/syncStore'

export const syncBootstrap = async () => {
  const { data } = await apiClient.get('/api/mobile/sync/bootstrap')
  return data
}

export const syncPull = async (since?: string) => {
  const { data } = await apiClient.get('/api/mobile/sync/pull', { params: since ? { since } : undefined })
  return data
}

export const syncPush = async (actions: SyncAction[], deviceId = 'mobile-app') => {
  const { data } = await apiClient.post('/api/mobile/sync/push', {
    technician_id: DEFAULT_TECHNICIAN_ID,
    device_id: deviceId,
    device_name: 'Application Mobile',
    platform: 'react-native',
    actions,
  })
  return data
}
