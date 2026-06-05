import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Radio, Activity, RefreshCw, FileText, Send, Lightbulb, ChevronRight } from 'lucide-react-native'
import { getLCUDetails, testLCU, syncLCU, addLCUFieldNote } from '../../api/lcus'
import { ETAT_COLORS, SYNC_ACTIONS } from '../../constants/config'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useSyncStore } from '../../store/syncStore'

const STATUS_COLOR: Record<string, string> = { online: '#22c55e', offline: '#ef4444', unknown: '#6b7280' }

export default function LCUDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const { addAction } = useSyncStore()
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const { data: lcu, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lcu', id],
    queryFn: () => getLCUDetails(Number(id)),
  })

  const testMut = useMutation({
    mutationFn: () => testLCU(Number(id)),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['lcu', id] }); Alert.alert('Test connectivité', `${r.status} — ${r.message}${r.latency_ms ? ` (${r.latency_ms}ms)` : ''}`) },
    onError: () => Alert.alert('Erreur', 'Test échoué.'),
  })
  const syncMut = useMutation({
    mutationFn: () => syncLCU(Number(id)),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['lcu', id] }); Alert.alert('Synchronisation', r.message) },
    onError: () => Alert.alert('Erreur', 'Synchronisation échouée.'),
  })
  const noteMut = useMutation({
    mutationFn: (n: string) => addLCUFieldNote(Number(id), n),
    onSuccess: () => { setNote(''); setShowNote(false); Alert.alert('Note', 'Note terrain enregistrée.') },
  })

  const handleTest = () => {
    if (!isOnline) { addAction({ type: SYNC_ACTIONS.TEST_LCU_CONNECTIVITY, entity: 'lcu', entity_id: Number(id), payload: {} }); Alert.alert('Enregistré', 'Test mis en file de sync.'); return }
    testMut.mutate()
  }
  const handleSync = () => {
    if (!isOnline) { addAction({ type: SYNC_ACTIONS.SYNC_LCU, entity: 'lcu', entity_id: Number(id), payload: {} }); Alert.alert('Enregistré', 'Sync LCU mise en file.'); return }
    syncMut.mutate()
  }
  const handleNote = () => {
    if (!note.trim()) return
    if (!isOnline) { addAction({ type: SYNC_ACTIONS.ADD_LCU_FIELD_NOTE, entity: 'lcu', entity_id: Number(id), payload: { note } }); setNote(''); setShowNote(false); Alert.alert('Enregistré', 'Note en file de sync.'); return }
    noteMut.mutate(note)
  }

  if (isLoading || !lcu) return <View style={styles.center}><Text style={styles.loading}>Chargement…</Text></View>
  const color = STATUS_COLOR[lcu.status] ?? '#6b7280'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}>

      <View style={styles.header}>
        <View style={styles.iconBox}><Radio size={22} color="#3b82f6" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{lcu.reference || lcu.name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{lcu.status}</Text>
          </View>
        </View>
      </View>

      {/* Infos réseau (lecture seule) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations réseau</Text>
        {[
          { k: 'Adresse IP', v: lcu.ip_address || '—' },
          { k: 'Port', v: lcu.port ? String(lcu.port) : '—' },
          { k: 'Protocole', v: lcu.protocol || '—' },
          { k: 'Zone', v: lcu.zone || '—' },
          { k: 'Dernière comm.', v: lcu.last_seen_at ? new Date(lcu.last_seen_at).toLocaleString('fr-FR') : '—' },
          { k: 'Dernière sync', v: lcu.last_sync_at ? new Date(lcu.last_sync_at).toLocaleString('fr-FR') : '—' },
        ].map((row) => (
          <View key={row.k} style={styles.row}>
            <Text style={styles.rowLabel}>{row.k}</Text>
            <Text style={styles.rowValue}>{row.v}</Text>
          </View>
        ))}
      </View>

      {/* Stats lampadaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lampadaires rattachés</Text>
        <View style={styles.statsRow}>
          {[
            { k: 'Total', v: lcu.lampadaires_count, c: '#e2e8f0' },
            { k: 'En ligne', v: lcu.online_count, c: '#22c55e' },
            { k: 'Hors ligne', v: lcu.offline_count, c: '#ef4444' },
            { k: 'Maint.', v: lcu.maintenance_count, c: '#f59e0b' },
          ].map((s) => (
            <View key={s.k} style={styles.statCell}>
              <Text style={[styles.statVal, { color: s.c }]}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.k}</Text>
            </View>
          ))}
        </View>
        {lcu.lampadaires?.map((l: any) => {
          const lc = ETAT_COLORS[l.etat] ?? '#6b7280'
          return (
            <TouchableOpacity key={l.id} style={styles.lampRow} onPress={() => router.push(`/lampadaires/${l.id}` as never)}>
              <View style={[styles.lampDot, { backgroundColor: lc }]} />
              <Lightbulb size={13} color={(l.intensite ?? 0) > 0 ? '#22c55e' : '#64748b'} />
              <Text style={styles.lampRef}>{l.reference}</Text>
              <Text style={styles.lampInt}>{l.intensite ?? 0}%</Text>
              <ChevronRight size={14} color="#475569" />
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Actions terrain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions terrain</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.action} onPress={handleTest} disabled={testMut.isPending}>
            {testMut.isPending ? <ActivityIndicator size="small" color="#3b82f6" /> : <Activity size={18} color="#3b82f6" />}
            <Text style={styles.actionText}>Test connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={handleSync} disabled={syncMut.isPending}>
            {syncMut.isPending ? <ActivityIndicator size="small" color="#22c55e" /> : <RefreshCw size={18} color="#22c55e" />}
            <Text style={styles.actionText}>Synchroniser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => setShowNote(!showNote)}>
            <FileText size={18} color="#f59e0b" /><Text style={styles.actionText}>Note terrain</Text>
          </TouchableOpacity>
          {lcu.latitude != null && (
            <TouchableOpacity style={styles.action} onPress={() => router.push('/map')}>
              <Radio size={18} color="#8b5cf6" /><Text style={styles.actionText}>Voir carte</Text>
            </TouchableOpacity>
          )}
        </View>
        {showNote && (
          <View style={styles.noteBox}>
            <TextInput style={styles.input} multiline placeholder="Observation terrain LCU…" placeholderTextColor="#64748b" value={note} onChangeText={setNote} />
            <TouchableOpacity style={styles.sendBtn} onPress={handleNote}>
              <Send size={14} color="#fff" /><Text style={styles.sendText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loading: { color: '#94a3b8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#3b82f622', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', fontFamily: 'monospace', marginBottom: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { color: '#64748b', fontSize: 13 },
  rowValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCell: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { color: '#64748b', fontSize: 10, marginTop: 2 },
  lampRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  lampDot: { width: 6, height: 6, borderRadius: 3 },
  lampRef: { color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace', flex: 1 },
  lampInt: { color: '#64748b', fontSize: 11 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  actionText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  noteBox: { marginTop: 10, backgroundColor: '#0f172a', borderRadius: 10, padding: 10 },
  input: { color: '#f1f5f9', fontSize: 13, minHeight: 70, textAlignVertical: 'top', marginBottom: 8 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22c55e', padding: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
})
