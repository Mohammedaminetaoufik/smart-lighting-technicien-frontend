import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Location from 'expo-location'
import {
  Lightbulb, Radio, Stethoscope, FileText, MapPin, ClipboardList,
  Send, AlertTriangle, Wifi, WifiOff, Wrench, Thermometer, Zap, Gauge,
} from 'lucide-react-native'
import { getLampadaireDetails, addLampadaireFieldNote, updateLampadaireLocation } from '../../api/lampadaires'
import AIFieldDiagnostic from '../../components/AIFieldDiagnostic'
import { ETAT_COLORS, COMMISSIONING_LABEL, SYNC_ACTIONS } from '../../constants/config'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useSyncStore } from '../../store/syncStore'

const ETAT_LABEL: Record<string, string> = { online: 'En ligne', offline: 'Hors ligne', maintenance: 'Maintenance' }
const ETAT_ICON: Record<string, React.FC<any>> = { online: Wifi, offline: WifiOff, maintenance: Wrench }

export default function LampadaireDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const { addAction } = useSyncStore()
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const { data: l, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lampadaire', id],
    queryFn: () => getLampadaireDetails(Number(id)),
  })

  const noteMut = useMutation({
    mutationFn: (n: string) => addLampadaireFieldNote(Number(id), n),
    onSuccess: () => { setNote(''); setShowNote(false); qc.invalidateQueries({ queryKey: ['lampadaire', id] }) },
  })

  const handleNote = () => {
    if (!note.trim()) return
    if (!isOnline) {
      addAction({ type: SYNC_ACTIONS.ADD_LAMPADAIRE_FIELD_NOTE, entity: 'lampadaire', entity_id: Number(id), payload: { note } })
      Alert.alert('Note enregistrée', 'Synchronisation au retour du réseau.')
      setNote(''); setShowNote(false); return
    }
    noteMut.mutate(note)
  }

  const [gpsLoading, setGpsLoading] = useState(false)
  const handleGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('GPS', 'Permission de localisation refusée.'); return }
    setGpsLoading(true)
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude, accuracy } = loc.coords
      const coordStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      Alert.alert(
        'Confirmer la localisation',
        `Mettre à jour la position de ${l?.reference || 'ce lampadaire'} ?\n\n📍 ${coordStr}${accuracy ? `\nPrécision : ±${Math.round(accuracy)} m` : ''}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer', onPress: async () => {
              if (!isOnline) {
                addAction({ type: SYNC_ACTIONS.UPDATE_LOCATION, entity: 'lampadaire', entity_id: Number(id), payload: { latitude, longitude, source: 'technician_mobile' } })
                Alert.alert('Position enregistrée', 'Synchronisation au retour du réseau.')
                return
              }
              try {
                await updateLampadaireLocation(Number(id), latitude, longitude, accuracy ?? 0)
                qc.invalidateQueries({ queryKey: ['lampadaire', id] })
                Alert.alert('GPS mis à jour', coordStr)
              } catch { Alert.alert('Erreur', 'Mise à jour GPS échouée.') }
            }
          },
        ]
      )
    } catch { Alert.alert('Erreur GPS', 'Impossible d\'obtenir la position.') }
    finally { setGpsLoading(false) }
  }

  if (isLoading || !l) return <View style={styles.center}><Text style={styles.loading}>Chargement…</Text></View>

  const color = ETAT_COLORS[l.etat] ?? '#6b7280'
  const isLit = (l.intensite ?? 0) > 0
  const StatusIcon = ETAT_ICON[l.etat] ?? Wifi

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
          <Lightbulb size={22} color={isLit ? '#22c55e' : color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{l.reference}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: color + '1a' }]}>
              <StatusIcon size={10} color={color} />
              <Text style={[styles.badgeText, { color }]}>{ETAT_LABEL[l.etat] ?? l.etat}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: (isLit ? '#22c55e' : '#374151') + '1a' }]}>
              <Text style={[styles.badgeText, { color: isLit ? '#22c55e' : '#9ca3af' }]}>{isLit ? 'Allumé' : 'Éteint'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Caractéristiques techniques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Caractéristiques</Text>
        {[
          { k: 'Zone', v: l.zone || '—' },
          { k: 'Intensité', v: `${l.intensite ?? 0}%` },
          { k: 'Puissance nominale', v: l.nominal_power_w ? `${l.nominal_power_w} W` : (l.puissance ? `${l.puissance} W` : '—') },
          { k: 'Protocole', v: l.protocole || '—' },
          { k: 'Driver', v: [l.driver_brand, l.driver_model].filter(Boolean).join(' ') || l.type_driver || '—' },
          { k: 'Mise en service', v: COMMISSIONING_LABEL[l.commissioning_status] ?? l.commissioning_status },
          { k: 'Statut GPS', v: l.location_status || '—' },
          { k: 'Latitude', v: l.latitude != null ? l.latitude.toFixed(6) : '—' },
          { k: 'Longitude', v: l.longitude != null ? l.longitude.toFixed(6) : '—' },
          { k: 'Dernière comm.', v: l.last_seen_at ? new Date(l.last_seen_at).toLocaleString('fr-FR') : '—' },
        ].map((row) => (
          <View key={row.k} style={styles.row}>
            <Text style={styles.rowLabel}>{row.k}</Text>
            <Text style={styles.rowValue}>{row.v}</Text>
          </View>
        ))}
      </View>

      {/* LCU */}
      {l.lcu && (
        <TouchableOpacity style={styles.section} onPress={() => router.push(`/lcus/${l.lcu.id}` as never)}>
          <Text style={styles.sectionTitle}>Passerelle LCU</Text>
          <View style={styles.lcuRow}>
            <Radio size={16} color="#3b82f6" />
            <Text style={styles.lcuRef}>{l.lcu.reference}</Text>
            <Text style={styles.lcuIp}>{l.lcu.ip_address}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Télémétrie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dernière télémétrie</Text>
        {l.telemetry ? (
          <View style={styles.telemGrid}>
            {[
              { Icon: Thermometer, k: 'Temp.', v: l.telemetry.temperature, u: '°C', warn: 75 },
              { Icon: Gauge, k: 'Tension', v: l.telemetry.tension, u: 'V' },
              { Icon: Zap, k: 'Courant', v: l.telemetry.courant, u: 'A' },
              { Icon: Zap, k: 'Puissance', v: l.telemetry.puissance, u: 'W' },
              { Icon: Lightbulb, k: 'Luminosité', v: l.telemetry.luminosite, u: '%' },
            ].map(({ Icon, k, v, u, warn }) => v != null ? (
              <View key={k} style={styles.telemCell}>
                <Icon size={14} color="#64748b" />
                <Text style={[styles.telemValue, warn && Number(v) > warn ? { color: '#ef4444' } : {}]}>
                  {Number(v).toFixed(1)}{u}
                </Text>
                <Text style={styles.telemLabel}>{k}</Text>
              </View>
            ) : null)}
          </View>
        ) : <Text style={styles.noData}>Aucune télémétrie disponible</Text>}
      </View>

      {/* Alertes */}
      {l.open_alerts?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes ouvertes ({l.open_alerts.length})</Text>
          {l.open_alerts.map((a: any) => (
            <View key={a.id} style={styles.alertRow}>
              <AlertTriangle size={14} color="#fca5a5" />
              <Text style={styles.alertText}>{a.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Diagnostic terrain */}
      <AIFieldDiagnostic entityType="lampadaire" entityId={l.id} />

      {/* Actions terrain */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions terrain</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.action} onPress={() => router.push(`/diagnostic/${l.id}` as never)}>
            <Stethoscope size={18} color="#3b82f6" /><Text style={styles.actionText}>Diagnostic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => setShowNote(!showNote)}>
            <FileText size={18} color="#f59e0b" /><Text style={styles.actionText}>Note terrain</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={handleGPS} disabled={gpsLoading}>
            {gpsLoading
              ? <ActivityIndicator size="small" color="#22c55e" />
              : <MapPin size={18} color="#22c55e" />}
            <Text style={styles.actionText}>MAJ GPS</Text>
          </TouchableOpacity>
          {l.work_orders?.length > 0 && (
            <TouchableOpacity style={styles.action} onPress={() => router.push(`/workorders/${l.work_orders[0].id}` as never)}>
              <ClipboardList size={18} color="#8b5cf6" /><Text style={styles.actionText}>Intervention</Text>
            </TouchableOpacity>
          )}
        </View>

        {showNote && (
          <View style={styles.noteBox}>
            <TextInput style={styles.input} multiline placeholder="Observation terrain…" placeholderTextColor="#64748b" value={note} onChangeText={setNote} />
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
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f1f5f9', fontSize: 19, fontWeight: '800', fontFamily: 'monospace', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { color: '#64748b', fontSize: 13 },
  rowValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  lcuRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lcuRef: { color: '#f1f5f9', fontSize: 14, fontWeight: '700', fontFamily: 'monospace', flex: 1 },
  lcuIp: { color: '#94a3b8', fontSize: 12 },
  telemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  telemCell: { width: '30%', backgroundColor: '#0f172a', borderRadius: 10, padding: 10, alignItems: 'center', gap: 3 },
  telemValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  telemLabel: { color: '#64748b', fontSize: 10 },
  noData: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  alertText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  actionDisabled: { opacity: 0.4 },
  actionText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  noteBox: { marginTop: 10, backgroundColor: '#0f172a', borderRadius: 10, padding: 10 },
  input: { color: '#f1f5f9', fontSize: 13, minHeight: 70, textAlignVertical: 'top', marginBottom: 8 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22c55e', padding: 10, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
})
