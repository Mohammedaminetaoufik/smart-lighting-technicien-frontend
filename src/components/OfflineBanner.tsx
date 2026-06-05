import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CloudOff, RefreshCw } from 'lucide-react-native'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useSyncStore } from '../store/syncStore'

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus()
  const { pendingActions } = useSyncStore()

  if (isOnline && pendingActions.length === 0) return null

  const n = pendingActions.length
  return (
    <View style={[styles.banner, isOnline ? styles.pending : styles.offline]}>
      {isOnline ? <RefreshCw size={14} color="#fff" /> : <CloudOff size={14} color="#fff" />}
      <Text style={styles.text}>
        {isOnline
          ? `${n} action${n > 1 ? 's' : ''} en attente de synchronisation`
          : `Hors ligne${n > 0 ? ` — ${n} action${n > 1 ? 's' : ''} en file` : ''}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offline: { backgroundColor: '#ef4444' },
  pending: { backgroundColor: '#f59e0b' },
  text: { color: 'white', fontWeight: '600', fontSize: 13 },
})
