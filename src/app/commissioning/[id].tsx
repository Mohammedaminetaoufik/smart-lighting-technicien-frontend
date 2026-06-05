import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Location from 'expo-location'
import {
  MapPin, Radio as RadioIcon, Activity, Sliders, CheckCircle2, XCircle, FileText, Send,
} from 'lucide-react-native'
import {
  getCommissioningTask, commissioningUpdateGPS, commissioningTestComm,
  commissioningTestDimming, commissioningValidate, commissioningFail, commissioningAddNote,
} from '../../api/commissioning'
import { COMMISSIONING_LABEL, COMMISSIONING_COLOR, SYNC_ACTIONS } from '../../constants/config'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useSyncStore } from '../../store/syncStore'

const TEST_COLOR: Record<string, string> = { passed: '#22c55e', failed: '#ef4444', pending: '#6b7280' }

export default function CommissioningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const { addAction } = useSyncStore()
  const [note, setNote] = useState('')
  const [failReason, setFailReason] = useState('')
  const [mode, setMode] = useState<'none' | 'note' | 'fail'>('none')

  const { data: t, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['commissioning', id],
    queryFn: () => getCommissioningTask(Number(id)),
  })
  const inv = () => qc.invalidateQueries({ queryKey: ['commissioning', id] })

  const gpsMut  = useMutation({ mutationFn: (c: { lat: number; lng: number }) => commissioningUpdateGPS(Number(id), c.lat, c.lng), onSuccess: () => { inv(); Alert.alert('GPS', 'Position confirmée.') } })
  const commMut = useMutation({ mutationFn: () => commissioningTestComm(Number(id)), onSuccess: (r) => { inv(); Alert.alert('Test communication', r.result === 'passed' ? 'Réussi' : 'Échec') } })
  const dimMut  = useMutation({ mutationFn: () => commissioningTestDimming(Number(id)), onSuccess: (r) => { inv(); Alert.alert('Test dimming', r.result === 'passed' ? 'Réussi' : 'Échec') } })
  const valMut  = useMutation({ mutationFn: () => commissioningValidate(Number(id)), onSuccess: () => { inv(); Alert.alert('Validé', 'Lampadaire mis en service.'); router.back() } })
  const failMut = useMutation({ mutationFn: (r: string) => commissioningFail(Number(id), r), onSuccess: () => { inv(); setFailReason(''); setMode('none'); Alert.alert('Échec', 'Échec enregistré.') } })
  const noteMut = useMutation({ mutationFn: (n: string) => commissioningAddNote(Number(id), n), onSuccess: () => { inv(); setNote(''); setMode('none') } })

  const offline = (type: string, payload: Record<string, unknown> = {}) => {
    addAction({ type, entity: 'commissioning', entity_id: Number(id), payload })
    Alert.alert('Enregistré', 'Action en file de synchronisation.')
  }

  const handleGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('GPS', 'Permission refusée.'); return }
    const loc = await Location.getCurrentPositionAsync({})
    const { latitude, longitude } = loc.coords
    if (!isOnline) { offline(SYNC_ACTIONS.COMMISSIONING_UPDATE_GPS, { latitude, longitude }); return }
    gpsMut.mutate({ lat: latitude, lng: longitude })
  }
  const handleComm = () => isOnline ? commMut.mutate() : offline(SYNC_ACTIONS.COMMISSIONING_TEST_COMMUNICATION)
  const handleDim  = () => isOnline ? dimMut.mutate()  : offline(SYNC_ACTIONS.COMMISSIONING_TEST_DIMMING)
  const handleVal  = () => isOnline ? valMut.mutate()  : offline(SYNC_ACTIONS.COMMISSIONING_VALIDATE)
  const handleFail = () => {
    if (!failReason.trim()) return
    if (!isOnline) { offline(SYNC_ACTIONS.COMMISSIONING_FAIL, { reason: failReason }); setFailReason(''); setMode('none'); return }
    failMut.mutate(failReason)
  }
  const handleNote = () => {
    if (!note.trim()) return
    if (!isOnline) { offline(SYNC_ACTIONS.COMMISSIONING_ADD_NOTE, { note }); setNote(''); setMode('none'); return }
    noteMut.mutate(note)
  }

  if (isLoading || !t) return <View style={styles.center}><Text style={styles.loading}>Chargement…</Text></View>
  const color = COMMISSIONING_COLOR[t.commissioning_status] ?? '#6b7280'
  const done = t.commissioning_status === 'commissioned'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
          <CheckCircle2 size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.reference}</Text>
          <View style={[styles.badge, { backgroundColor: color + '1a', alignSelf: 'flex-start', marginTop: 4 }]}>
            <Text style={[styles.badgeText, { color }]}>{COMMISSIONING_LABEL[t.commissioning_status] ?? t.commissioning_status}</Text>
          </View>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        {[
          { k: 'Zone', v: t.zone || '—' },
          { k: 'LCU associée', v: t.lcu_reference || '—' },
          { k: 'État', v: t.etat },
          { k: 'GPS', v: t.latitude != null ? `${t.latitude.toFixed(5)}, ${t.longitude?.toFixed(5)}` : 'Non localisé' },
          { k: 'Statut localisation', v: t.location_status },
        ].map((row) => (
          <View key={row.k} style={styles.row}>
            <Text style={styles.rowLabel}>{row.k}</Text>
            <Text style={styles.rowValue}>{row.v}</Text>
          </View>
        ))}
      </View>

      {/* Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests techniques</Text>
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>Communication</Text>
          <View style={[styles.testBadge, { backgroundColor: (TEST_COLOR[t.test_comm_status] ?? '#6b7280') + '1a' }]}>
            <Text style={[styles.testBadgeText, { color: TEST_COLOR[t.test_comm_status] ?? '#6b7280' }]}>{t.test_comm_status}</Text>
          </View>
        </View>
        <View style={styles.testRow}>
          <Text style={styles.testLabel}>Dimming</Text>
          <View style={[styles.testBadge, { backgroundColor: (TEST_COLOR[t.test_dimming_status] ?? '#6b7280') + '1a' }]}>
            <Text style={[styles.testBadgeText, { color: TEST_COLOR[t.test_dimming_status] ?? '#6b7280' }]}>{t.test_dimming_status}</Text>
          </View>
        </View>
      </View>

      {/* Notes existantes */}
      {t.commissioning_notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes de mise en service</Text>
          <Text style={styles.notes}>{t.commissioning_notes.trim()}</Text>
        </View>
      ) : null}

      {/* Actions */}
      {!done && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étapes de mise en service</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.action} onPress={handleGPS} disabled={gpsMut.isPending}>
              <MapPin size={18} color="#f59e0b" /><Text style={styles.actionText}>Confirmer GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleComm} disabled={commMut.isPending}>
              {commMut.isPending ? <ActivityIndicator size="small" color="#3b82f6" /> : <Activity size={18} color="#3b82f6" />}
              <Text style={styles.actionText}>Test comm.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={handleDim} disabled={dimMut.isPending}>
              {dimMut.isPending ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Sliders size={18} color="#8b5cf6" />}
              <Text style={styles.actionText}>Test dimming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => setMode(mode === 'note' ? 'none' : 'note')}>
              <FileText size={18} color="#94a3b8" /><Text style={styles.actionText}>Note</Text>
            </TouchableOpacity>
          </View>

          {mode === 'note' && (
            <View style={styles.noteBox}>
              <TextInput style={styles.input} multiline placeholder="Note de mise en service…" placeholderTextColor="#64748b" value={note} onChangeText={setNote} />
              <TouchableOpacity style={styles.sendBtn} onPress={handleNote}><Send size={14} color="#fff" /><Text style={styles.sendText}>Ajouter</Text></TouchableOpacity>
            </View>
          )}

          {/* Valider / Échec */}
          <TouchableOpacity style={styles.validateBtn} onPress={handleVal} disabled={valMut.isPending}>
            <CheckCircle2 size={18} color="#fff" /><Text style={styles.validateText}>Valider la mise en service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.failBtn} onPress={() => setMode(mode === 'fail' ? 'none' : 'fail')}>
            <XCircle size={16} color="#ef4444" /><Text style={styles.failText}>Signaler un échec</Text>
          </TouchableOpacity>
          {mode === 'fail' && (
            <View style={styles.noteBox}>
              <TextInput style={styles.input} multiline placeholder="Raison de l'échec…" placeholderTextColor="#64748b" value={failReason} onChangeText={setFailReason} />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: '#ef4444' }]} onPress={handleFail}>
                <XCircle size={14} color="#fff" /><Text style={styles.sendText}>Confirmer l'échec</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {done && (
        <View style={[styles.section, { alignItems: 'center', paddingVertical: 24 }]}>
          <CheckCircle2 size={40} color="#22c55e" />
          <Text style={styles.doneText}>Lampadaire mis en service</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loading: { color: '#94a3b8' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { color: '#64748b', fontSize: 13 },
  rowValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  testRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  testLabel: { color: '#cbd5e1', fontSize: 13 },
  testBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  testBadgeText: { fontSize: 11, fontWeight: '700' },
  notes: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  action: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  actionText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  noteBox: { marginBottom: 12, backgroundColor: '#0f172a', borderRadius: 10, padding: 10 },
  input: { color: '#f1f5f9', fontSize: 13, minHeight: 60, textAlignVertical: 'top', marginBottom: 8 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22c55e', padding: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
  validateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', padding: 14, borderRadius: 12, marginBottom: 8 },
  validateText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  failBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444444', padding: 12, borderRadius: 12 },
  failText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  doneText: { color: '#22c55e', fontSize: 15, fontWeight: '700', marginTop: 10 },
})
