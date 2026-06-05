import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope, CheckCircle2, Play, FileText, Flag, Map as MapIcon, Send,
} from 'lucide-react-native'
import { getWorkOrder, acceptWorkOrder, startWorkOrder, addNote, resolveWorkOrder, blockWorkOrder } from '../../api/workorders'
import { StatusBadge } from '../../components/StatusBadge'
import { useSyncStore, SYNC_ACTIONS } from '../../store/syncStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

export default function WorkOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const { addAction } = useSyncStore()
  const [noteText, setNoteText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [resolveNote, setResolveNote] = useState('')
  const [showResolveInput, setShowResolveInput] = useState(false)

  const { data: wo, isLoading } = useQuery({
    queryKey: ['workorder', id],
    queryFn: () => getWorkOrder(Number(id)),
  })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['workorder', id] }); qc.invalidateQueries({ queryKey: ['workorders'] }) }

  const acceptMut = useMutation({
    mutationFn: () => acceptWorkOrder(Number(id)),
    onSuccess: invalidate,
    onError: (err: { response?: { status?: number; data?: { error?: string } } }) => {
      const msg = err?.response?.status === 409
        ? (err.response.data?.error || 'Ce bon de travail a déjà été pris par un autre technicien.')
        : 'Impossible de prendre ce bon de travail.'
      Alert.alert('Action impossible', msg)
      invalidate()
    },
  })
  const startMut  = useMutation({ mutationFn: () => startWorkOrder(Number(id)), onSuccess: invalidate })
  const noteMut   = useMutation({ mutationFn: (n: string) => addNote(Number(id), n), onSuccess: () => { setNoteText(''); setShowNoteInput(false); invalidate() } })
  const resolveMut = useMutation({ mutationFn: (n: string) => resolveWorkOrder(Number(id), n), onSuccess: () => { setResolveNote(''); setShowResolveInput(false); invalidate() } })

  const handleOfflineAction = (type: string, payload: Record<string, unknown> = {}) => {
    addAction({ type, entity: 'work_order', entity_id: Number(id), payload })
    Alert.alert('Action enregistrée', 'Elle sera synchronisée dès que le réseau sera disponible.')
    invalidate()
  }

  const handleAccept = () => {
    if (!isOnline) { handleOfflineAction(SYNC_ACTIONS.ACCEPT_WORK_ORDER); return }
    acceptMut.mutate()
  }
  const handleStart = () => {
    if (!isOnline) { handleOfflineAction(SYNC_ACTIONS.START_WORK_ORDER); return }
    startMut.mutate()
  }
  const handleNote = () => {
    if (!noteText.trim()) return
    if (!isOnline) { handleOfflineAction(SYNC_ACTIONS.ADD_NOTE, { note: noteText }); setNoteText(''); setShowNoteInput(false); return }
    noteMut.mutate(noteText)
  }
  const handleResolve = () => {
    if (!resolveNote.trim()) return
    if (!isOnline) { handleOfflineAction(SYNC_ACTIONS.RESOLVE_WORK_ORDER, { resolution_note: resolveNote }); setResolveNote(''); setShowResolveInput(false); return }
    resolveMut.mutate(resolveNote)
  }

  if (isLoading || !wo) {
    return <View style={styles.center}><Text style={styles.loading}>Chargement…</Text></View>
  }

  const status = wo.status

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{wo.title}</Text>
        <View style={styles.badges}>
          <StatusBadge type="status"   value={wo.status}   />
          <StatusBadge type="priority" value={wo.priority} />
        </View>
        {wo.description ? <Text style={styles.description}>{wo.description}</Text> : null}
      </View>

      {/* Lampadaire info */}
      {wo.lampadaire && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lampadaire</Text>
          <View style={styles.infoRow}><Text style={styles.label}>Référence</Text><Text style={styles.value}>{wo.lampadaire.reference}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>Zone</Text><Text style={styles.value}>{wo.lampadaire.zone}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>État</Text><StatusBadge type="etat" value={wo.lampadaire.etat} small /></View>
          <View style={styles.infoRow}><Text style={styles.label}>Intensité</Text><Text style={styles.value}>{wo.lampadaire.intensite ?? 0}%</Text></View>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push(`/diagnostic/${wo.lampadaire!.id}` as never)}>
            <Stethoscope size={15} color="#93c5fd" />
            <Text style={styles.linkBtnText}>Voir le diagnostic</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LCU info */}
      {wo.lcu && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passerelle LCU</Text>
          <View style={styles.infoRow}><Text style={styles.label}>Référence</Text><Text style={styles.value}>{wo.lcu.reference}</Text></View>
          <View style={styles.infoRow}><Text style={styles.label}>IP</Text><Text style={styles.value}>{wo.lcu.ip_address}</Text></View>
        </View>
      )}

      {/* Telemetry */}
      {wo.telemetry && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernière télémétrie</Text>
          {[
            { k: 'Température', v: wo.telemetry.temperature, u: '°C' },
            { k: 'Luminosité',  v: wo.telemetry.luminosite,  u: '%' },
            { k: 'Puissance',   v: wo.telemetry.puissance,   u: 'W' },
            { k: 'Courant',     v: wo.telemetry.courant,     u: 'A' },
            { k: 'Tension',     v: wo.telemetry.tension,     u: 'V' },
          ].map(({ k, v, u }) => v != null ? (
            <View key={k} style={styles.infoRow}>
              <Text style={styles.label}>{k}</Text>
              <Text style={styles.value}>{Number(v).toFixed(1)} {u}</Text>
            </View>
          ) : null)}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {['created', 'open'].includes(status) && (
          <TouchableOpacity style={[styles.btn, styles.btnBlue]} onPress={handleAccept} disabled={acceptMut.isPending}>
            <CheckCircle2 size={16} color="#fff" />
            <Text style={styles.btnText}>Accepter cette intervention</Text>
          </TouchableOpacity>
        )}
        {status === 'accepted' && (
          <TouchableOpacity style={[styles.btn, styles.btnAmber]} onPress={handleStart} disabled={startMut.isPending}>
            <Play size={16} color="#fff" />
            <Text style={styles.btnText}>Démarrer l'intervention</Text>
          </TouchableOpacity>
        )}
        {['accepted', 'in_progress'].includes(status) && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnSlate]} onPress={() => setShowNoteInput(!showNoteInput)}>
              <FileText size={16} color="#fff" />
              <Text style={styles.btnText}>Ajouter une note</Text>
            </TouchableOpacity>
            {showNoteInput && (
              <View style={styles.noteBox}>
                <TextInput
                  style={styles.input} multiline numberOfLines={3}
                  placeholder="Votre observation…" placeholderTextColor="#64748b"
                  value={noteText} onChangeText={setNoteText}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleNote}>
                  <Send size={14} color="#fff" />
                  <Text style={styles.sendBtnText}>Envoyer</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        {status === 'in_progress' && (
          <>
            <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={() => setShowResolveInput(!showResolveInput)}>
              <Flag size={16} color="#fff" />
              <Text style={styles.btnText}>Résoudre l'intervention</Text>
            </TouchableOpacity>
            {showResolveInput && (
              <View style={styles.noteBox}>
                <TextInput
                  style={styles.input} multiline numberOfLines={3}
                  placeholder="Décrivez la résolution…" placeholderTextColor="#64748b"
                  value={resolveNote} onChangeText={setResolveNote}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleResolve}>
                  <Flag size={14} color="#fff" />
                  <Text style={styles.sendBtnText}>Confirmer la résolution</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={[styles.btn, styles.btnSlate]} onPress={() => router.push('/map')}>
          <MapIcon size={16} color="#fff" />
          <Text style={styles.btnText}>Voir sur la carte</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      {wo.logs?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {wo.logs.map((log: { id: number; user_name: string; action: string; note: string; created_at: string }) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logAction}>{log.user_name} — {log.action}</Text>
              {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
              <Text style={styles.logDate}>{new Date(log.created_at).toLocaleString('fr-FR')}</Text>
            </View>
          ))}
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
  header: { marginBottom: 16 },
  title: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  description: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#334155' },
  label: { color: '#64748b', fontSize: 13 },
  value: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  linkBtn: { marginTop: 10, padding: 10, backgroundColor: '#334155', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  linkBtnText: { color: '#93c5fd', fontSize: 13, fontWeight: '600' },
  btn: { padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  btnBlue:  { backgroundColor: '#3b82f6' },
  btnAmber: { backgroundColor: '#f59e0b' },
  btnGreen: { backgroundColor: '#22c55e' },
  btnSlate: { backgroundColor: '#334155' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  noteBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginBottom: 8 },
  input: { color: '#f1f5f9', fontSize: 13, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  sendBtn: { backgroundColor: '#22c55e', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sendBtnText: { color: 'white', fontWeight: '700' },
  logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logAction: { color: '#f1f5f9', fontSize: 12, fontWeight: '600' },
  logNote: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  logDate: { color: '#475569', fontSize: 11, marginTop: 2 },
})
