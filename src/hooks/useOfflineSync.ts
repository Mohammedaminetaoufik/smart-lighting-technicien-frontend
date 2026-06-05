import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { useNetworkStatus } from './useNetworkStatus'
import { useSyncStore } from '../store/syncStore'
import { syncPush } from '../api/sync'

interface SyncResult {
  status: string
  local_id: string
  message?: string
}

export const useOfflineSync = () => {
  const { isOnline } = useNetworkStatus()
  const { pendingActions, removeActions, setLastSyncAt } = useSyncStore()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline || pendingActions.length === 0 || syncingRef.current) return
    syncingRef.current = true
    syncPush(pendingActions)
      .then((res) => {
        const results: SyncResult[] = res.results ?? []

        // Toute action traitée par le serveur (succès, conflit ou erreur) est
        // retirée de la file : le serveur est idempotent, la renvoyer ne
        // changerait rien et bloquerait la file indéfiniment.
        removeActions(results.map((r) => r.local_id))
        setLastSyncAt(new Date().toISOString())

        // On informe le technicien des actions qui n'ont PAS été appliquées
        // (ex. un bon de travail déjà pris par un collègue).
        const failed = results.filter((r) => r.status !== 'success')
        if (failed.length > 0) {
          Alert.alert(
            'Certaines actions n’ont pas été appliquées',
            failed.map((f) => `• ${f.message || f.status}`).join('\n'),
          )
        }
      })
      .catch(() => {})
      .finally(() => { syncingRef.current = false })
  }, [isOnline])

  return { isOnline, pendingCount: pendingActions.length }
}
