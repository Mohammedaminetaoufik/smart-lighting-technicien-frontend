import { useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { useSyncStore } from '../store/syncStore'
import { syncPush } from '../api/sync'

export const useOfflineSync = () => {
  const { isOnline } = useNetworkStatus()
  const { pendingActions, removeActions, setLastSyncAt } = useSyncStore()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline || pendingActions.length === 0 || syncingRef.current) return
    syncingRef.current = true
    syncPush(pendingActions)
      .then((res) => {
        const successIds = (res.results ?? [])
          .filter((r: { status: string; local_id: string }) => r.status === 'success')
          .map((r: { local_id: string }) => r.local_id)
        removeActions(successIds)
        setLastSyncAt(new Date().toISOString())
      })
      .catch(() => {})
      .finally(() => { syncingRef.current = false })
  }, [isOnline])

  return { isOnline, pendingCount: pendingActions.length }
}
