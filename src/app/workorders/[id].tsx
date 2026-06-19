import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope, CheckCircle2, Play, FileText, Flag, Map as MapIcon, Send,
  Camera, Image as ImageIcon, Bell, Calendar,
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { 
  getWorkOrder, acceptWorkOrder, startWorkOrder, addNote, 
  resolveWorkOrder, blockWorkOrder, getWorkOrderPhotos, uploadWorkOrderPhoto 
} from '../../api/workorders'
import { StatusBadge } from '../../components/StatusBadge'
import { useSyncStore, SYNC_ACTIONS } from '../../store/syncStore'
import { useThemeStore } from '../../store/themeStore'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { Palette } from '../../constants/theme'
import { API_URL } from '../../constants/config'
import AIFieldDiagnostic from '../../components/AIFieldDiagnostic'

export default function WorkOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const { addAction } = useSyncStore()
  const { palette } = useThemeStore()
  const styles = React.useMemo(() => createStyles(palette), [palette])

  const [noteText, setNoteText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [resolveNote, setResolveNote] = useState('')
  const [showResolveInput, setShowResolveInput] = useState(false)

  const { data: wo, isLoading } = useQuery({
    queryKey: ['workorder', id],
    queryFn: () => getWorkOrder(Number(id)),
  })

  const { data: photos = [] } = useQuery({
    queryKey: ['workorder-photos', id],
    queryFn: () => getWorkOrderPhotos(Number(id)),
    enabled: !!id,
  })

  const invalidate = () => { 
    qc.invalidateQueries({ queryKey: ['workorder', id] })
    qc.invalidateQueries({ queryKey: ['workorders'] })
    qc.invalidateQueries({ queryKey: ['workorder-photos', id] })
  }

  const uploadMut = useMutation({
    mutationFn: (uri: string) => uploadWorkOrderPhoto(Number(id), uri),
    onSuccess: () => {
      Alert.alert('Succès', 'Photo ajoutée au bon de travail')
      invalidate()
    },
    onError: () => Alert.alert('Erreur', "Échec de l'upload de la photo")
  })

  const handlePickImage = async () => {
    if (!isOnline) {
      Alert.alert('Hors ligne', "L'upload de photos nécessite une connexion internet.")
      return
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Nous avons besoin d'accéder à vos photos.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0].uri) {
      uploadMut.mutate(result.assets[0].uri)
    }
  }

  const handleTakePhoto = async () => {
    if (!isOnline) {
      Alert.alert('Hors ligne', "L'upload de photos nécessite une connexion internet.")
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Nous avons besoin d'accéder à votre caméra.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0].uri) {
      uploadMut.mutate(result.assets[0].uri)
    }
  }

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
  const canModify = ['accepted', 'in_progress'].includes(status)

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

      {/* Alerte source */}
      {wo.alert && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Bell size={13} color="#fca5a5" />
            <Text style={styles.sectionTitle}>Alerte source</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sévérité</Text>
            <StatusBadge type="priority" value={wo.alert.severity} small />
          </View>
          <View style={styles.alertMsgBox}>
            <Text style={styles.alertMsgText}>{wo.alert.message}</Text>
          </View>
        </View>
      )}

      {/* Fenêtre de maintenance */}
      {wo.maintenance_window && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={13} color="#93c5fd" />
            <Text style={styles.sectionTitle}>Fenêtre de maintenance</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Titre</Text>
            <Text style={styles.value}>{wo.maintenance_window.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Statut</Text>
            <StatusBadge type="status" value={wo.maintenance_window.status} small />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Impact</Text>
            <Text style={styles.value}>{wo.maintenance_window.impact_level}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Début</Text>
            <Text style={styles.value}>{new Date(wo.maintenance_window.start_at).toLocaleString('fr-FR')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fin</Text>
            <Text style={styles.value}>{new Date(wo.maintenance_window.end_at).toLocaleString('fr-FR')}</Text>
          </View>
          {wo.maintenance_window.reason ? (
            <View style={styles.alertMsgBox}>
              <Text style={styles.alertMsgText}>{wo.maintenance_window.reason}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* AI Diagnostic terrain */}
      <AIFieldDiagnostic entityType="workorder" entityId={id} />

      {/* Photos Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photos du terrain</Text>
          <View style={styles.photoCount}><Text style={styles.photoCountText}>{photos.length}</Text></View>
        </View>

        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((p: any) => (
              <TouchableOpacity key={p.id} style={styles.photoThumbContainer}>
                <Image source={{ uri: API_URL + p.url }} style={styles.photoThumb} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyPhotos}>
            <ImageIcon size={20} color={palette.textMuted} opacity={0.3} />
            <Text style={styles.emptyPhotosText}>Aucune photo pour le moment</Text>
          </View>
        )}

        {canModify && (
          <View style={styles.photoActions}>
            <TouchableOpacity 
              style={[styles.photoBtn, uploadMut.isPending && styles.btnDisabled]} 
              onPress={handleTakePhoto}
              disabled={uploadMut.isPending}
            >
              {uploadMut.isPending ? <ActivityIndicator size="small" color={palette.brand} /> : <Camera size={16} color={palette.brand} />}
              <Text style={styles.photoBtnText}>Prendre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.photoBtn, uploadMut.isPending && styles.btnDisabled]} 
              onPress={handlePickImage}
              disabled={uploadMut.isPending}
            >
              <ImageIcon size={16} color={palette.brand} />
              <Text style={styles.photoBtnText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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

const createStyles = (p: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: p.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg },
  loading: { color: p.textMuted },
  header: { marginBottom: 16 },
  title: { color: p.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  description: { color: p.textMuted, fontSize: 13, lineHeight: 20 },
  section: { backgroundColor: p.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: p.border },
  sectionTitle: { color: p.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: p.border },
  label: { color: p.textMuted, fontSize: 13 },
  value: { color: p.text, fontSize: 13, fontWeight: '600' },
  linkBtn: { marginTop: 10, padding: 10, backgroundColor: p.surface2, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  linkBtnText: { color: p.accent, fontSize: 13, fontWeight: '600' },
  btn: { padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  btnBlue:  { backgroundColor: p.accent },
  btnAmber: { backgroundColor: p.warning },
  btnGreen: { backgroundColor: p.success },
  btnSlate: { backgroundColor: p.surface2 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  noteBox: { backgroundColor: p.bg, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: p.border },
  input: { color: p.text, fontSize: 13, minHeight: 80, textAlignVertical: 'top', marginBottom: 8 },
  sendBtn: { backgroundColor: p.success, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sendBtnText: { color: 'white', fontWeight: '700' },
  logRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.border },
  logAction: { color: p.text, fontSize: 12, fontWeight: '600' },
  logNote: { color: p.textMuted, fontSize: 12, marginTop: 2 },
  logDate: { color: p.textMuted, opacity: 0.7, fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  alertMsgBox: { marginTop: 8, padding: 10, backgroundColor: p.bg, borderRadius: 8, borderWidth: 1, borderColor: p.border },
  alertMsgText: { color: p.textMuted, fontSize: 12, lineHeight: 18 },
  photoCount: { backgroundColor: p.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  photoCountText: { color: p.textMuted, fontSize: 11, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  photoThumbContainer: { width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: p.bg },
  photoThumb: { width: '100%', height: '100%' },
  emptyPhotos: { alignItems: 'center', paddingVertical: 20, gap: 6, marginBottom: 10 },
  emptyPhotosText: { color: p.textMuted, fontSize: 11 },
  photoActions: { flexDirection: 'row', gap: 8 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: p.bg, borderWidth: 1, borderColor: p.border },
  photoBtnText: { color: p.brand, fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
})
