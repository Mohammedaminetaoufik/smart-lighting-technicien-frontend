import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import {
  Wifi, WifiOff, RefreshCw, CheckCircle2, Play, FileText, Flag,
  Ban, MapPin, Check, X,
} from 'lucide-react-native'
import { useSyncStore } from '../store/syncStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { syncPush } from '../api/sync'

const ACTION_META: Record<string, { Icon: React.FC<any>; label: string; color: string }> = {
  ACCEPT_WORK_ORDER:  { Icon: CheckCircle2, label: 'Accepter',     color: '#3b82f6' },
  START_WORK_ORDER:   { Icon: Play,         label: 'Démarrer',     color: '#f59e0b' },
  ADD_NOTE:           { Icon: FileText,     label: 'Note',         color: '#94a3b8' },
  RESOLVE_WORK_ORDER: { Icon: Flag,         label: 'Résoudre',     color: '#22c55e' },
  BLOCK_WORK_ORDER:   { Icon: Ban,          label: 'Bloquer',      color: '#ef4444' },
  UPDATE_LOCATION:    { Icon: MapPin,       label: 'Localisation', color: '#3b82f6' },
}

export default function SyncScreen() {
  const { isOnline } = useNetworkStatus()
  const { pendingActions, removeActions, setLastSyncAt, lastSyncAt } = useSyncStore()
  const [syncing, setSyncing] = useState(false)
  const [lastResults, setLastResults] = useState<Array<{ local_id: string; status: string; message: string }>>([])

  const handleSync = async () => {
    if (!isOnline) { Alert.alert('Hors ligne', 'Connexion réseau requise pour synchroniser.'); return }
    if (pendingActions.length === 0) { Alert.alert('À jour', 'Aucune action en attente.'); return }
    setSyncing(true)
    try {
      const res = await syncPush(pendingActions)
      const results = res.results ?? []
      setLastResults(results)
      const successIds = results.filter((r: { status: string }) => r.status === 'success').map((r: { local_id: string }) => r.local_id)
      removeActions(successIds)
      setLastSyncAt(new Date().toISOString())
      Alert.alert('Synchronisation terminée', `${successIds.length}/${pendingActions.length} action${successIds.length > 1 ? 's' : ''} synchronisée${successIds.length > 1 ? 's' : ''}.`)
    } catch {
      Alert.alert('Erreur', 'La synchronisation a échoué. Vérifiez votre connexion.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Status */}
      <View style={[styles.statusCard, { borderColor: isOnline ? '#22c55e44' : '#ef444444' }]}>
        {isOnline ? <Wifi size={18} color="#22c55e" /> : <WifiOff size={18} color="#ef4444" />}
        <Text style={[styles.statusText, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
          {isOnline ? 'Connecté' : 'Hors ligne'}
        </Text>
        {lastSyncAt && (
          <Text style={styles.lastSync}>
            Dernière sync : {new Date(lastSyncAt).toLocaleString('fr-FR')}
          </Text>
        )}
      </View>

      {/* Sync button */}
      <TouchableOpacity
        style={[styles.syncBtn, (!isOnline || pendingActions.length === 0) && styles.syncBtnDisabled]}
        onPress={handleSync}
        disabled={syncing || !isOnline || pendingActions.length === 0}
      >
        {syncing ? <ActivityIndicator color="white" /> : (
          <>
            {pendingActions.length === 0
              ? <CheckCircle2 size={18} color="#fff" />
              : <RefreshCw size={18} color="#fff" />}
            <Text style={styles.syncBtnText}>
              {pendingActions.length === 0 ? 'Tout est synchronisé' : `Synchroniser (${pendingActions.length})`}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Pending actions */}
      {pendingActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En attente de synchronisation</Text>
          {pendingActions.map((a) => {
            const meta = ACTION_META[a.type] ?? { Icon: FileText, label: a.type, color: '#94a3b8' }
            const Icon = meta.Icon
            return (
              <View key={a.local_id} style={styles.actionRow}>
                <View style={[styles.actionIconBox, { backgroundColor: meta.color + '1a' }]}>
                  <Icon size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionType}>{meta.label}</Text>
                  <Text style={styles.actionDetail}>
                    {a.entity} #{a.entity_id}
                    {a.payload?.note ? ` — "${String(a.payload.note).slice(0, 36)}…"` : ''}
                  </Text>
                  <Text style={styles.actionDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Last sync results */}
      {lastResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats de la dernière synchronisation</Text>
          {lastResults.map((r) => {
            const ok = r.status === 'success'
            return (
              <View key={r.local_id} style={styles.resultRow}>
                <View style={[styles.resultIconBox, { backgroundColor: (ok ? '#22c55e' : '#ef4444') + '1a' }]}>
                  {ok ? <Check size={14} color="#22c55e" /> : <X size={14} color="#ef4444" />}
                </View>
                <Text style={styles.resultMessage}>{r.message}</Text>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16, paddingBottom: 40 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, flexWrap: 'wrap' },
  statusText: { fontWeight: '700', fontSize: 15 },
  lastSync: { color: '#64748b', fontSize: 11, marginTop: 2, width: '100%' },
  syncBtn: { backgroundColor: '#22c55e', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  syncBtnDisabled: { backgroundColor: '#334155' },
  syncBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  actionIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionType: { color: '#f1f5f9', fontWeight: '700', fontSize: 13 },
  actionDetail: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  actionDate: { color: '#475569', fontSize: 11, marginTop: 2 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  resultIconBox: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  resultMessage: { color: '#94a3b8', fontSize: 13, flex: 1 },
})
