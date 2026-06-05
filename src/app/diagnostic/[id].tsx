import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getDiagnostic } from '../../api/diagnostic'
import { StatusBadge } from '../../components/StatusBadge'

interface TelemetryRow { label: string; value: number | null | undefined; unit: string; warnAbove?: number }

const Row: React.FC<{ label: string; value: string; warn?: boolean }> = ({ label, value, warn }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, warn && styles.rowWarn]}>{value}</Text>
  </View>
)

export default function DiagnosticScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['diagnostic', id],
    queryFn: () => getDiagnostic(Number(id)),
    staleTime: 30_000,
  })

  if (isLoading) return <View style={styles.center}><Text style={styles.loading}>Chargement du diagnostic…</Text></View>
  if (!data) return <View style={styles.center}><Text style={styles.loading}>Lampadaire introuvable</Text></View>

  const { lampadaire, lcu, telemetry, open_alerts } = data

  const telemRows: TelemetryRow[] = [
    { label: 'Température', value: telemetry?.temperature, unit: '°C', warnAbove: 75 },
    { label: 'Luminosité',  value: telemetry?.luminosite,  unit: '%' },
    { label: 'Puissance',   value: telemetry?.puissance,   unit: 'W' },
    { label: 'Courant',     value: telemetry?.courant,     unit: 'A' },
    { label: 'Tension',     value: telemetry?.tension,     unit: 'V' },
  ]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
    >
      {/* Lampadaire info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lampadaire</Text>
        <Row label="Référence" value={lampadaire.reference} />
        <Row label="Zone"      value={lampadaire.zone} />
        <View style={[styles.row, { alignItems: 'center' }]}>
          <Text style={styles.rowLabel}>État</Text>
          <StatusBadge type="etat" value={lampadaire.etat} />
        </View>
        <Row label="Intensité" value={`${lampadaire.intensite ?? 0}%`} />
        {lampadaire.puissance != null && <Row label="Puissance nominale" value={`${lampadaire.puissance} W`} />}
        <Row label="Commissioning" value={lampadaire.commissioning_status} />
        {lampadaire.last_seen_at && <Row label="Dernière comm." value={new Date(lampadaire.last_seen_at).toLocaleString('fr-FR')} />}
      </View>

      {/* LCU info */}
      {lcu && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passerelle LCU</Text>
          <Row label="Référence" value={lcu.reference} />
          <Row label="IP"        value={lcu.ip_address} />
        </View>
      )}

      {/* Telemetry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dernière télémétrie</Text>
        {telemetry ? (
          <>
            {telemRows.map(({ label, value, unit, warnAbove }) => value != null ? (
              <Row key={label} label={label} value={`${Number(value).toFixed(1)} ${unit}`}
                warn={warnAbove != null && Number(value) > warnAbove} />
            ) : null)}
            {telemetry.created_at && (
              <Row label="Relevée à" value={new Date(telemetry.created_at).toLocaleString('fr-FR')} />
            )}
          </>
        ) : (
          <Text style={styles.noData}>Aucune télémétrie disponible</Text>
        )}
      </View>

      {/* Alerts */}
      {open_alerts?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes ouvertes ({open_alerts.length})</Text>
          {open_alerts.map((a: { id: number; severity: string; message: string }) => (
            <View key={a.id} style={styles.alertItem}>
              <StatusBadge type="priority" value={a.severity} small />
              <Text style={styles.alertMessage}>{a.message}</Text>
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
  loading: { color: '#94a3b8', fontSize: 16 },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 12 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { color: '#64748b', fontSize: 13 },
  rowValue: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  rowWarn: { color: '#ef4444' },
  noData: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  alertMessage: { color: '#fca5a5', fontSize: 13, flex: 1 },
  powerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: '#334155',
  },
  powerBtnActive: { backgroundColor: '#22c55e20', borderColor: '#22c55e' },
  powerBtnText: { marginLeft: 10, fontSize: 15, fontWeight: '700', color: '#64748b' },
  powerBtnTextActive: { color: '#22c55e' },
})
