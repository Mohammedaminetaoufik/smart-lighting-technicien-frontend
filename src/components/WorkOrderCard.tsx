import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MapPin, AlertTriangle } from 'lucide-react-native'
import { StatusBadge } from './StatusBadge'
import { PRIORITY_COLORS } from '../constants/config'

interface WorkOrderCardProps {
  workOrder: {
    id: number
    title: string
    description: string
    status: string
    priority: string
    zone?: string
    technician_id?: number | null
    assigned_to_name?: string
    lampadaire?: { reference: string; etat: string; zone: string } | null
    alert?: { severity: string; message: string } | null
  }
  onPress: () => void
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder: wo, onPress }) => {
  const borderColor = PRIORITY_COLORS[wo.priority] ?? '#6b7280'
  const isAvailable = !wo.technician_id && !wo.assigned_to_name && ['created', 'open'].includes(wo.status)
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>{wo.title}</Text>
        <Text style={styles.id}>#{wo.id}</Text>
      </View>
      <View style={styles.badges}>
        <StatusBadge type="status"   value={wo.status}   small />
        <StatusBadge type="priority" value={wo.priority} small />
        {isAvailable && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Disponible</Text>
          </View>
        )}
      </View>
      {wo.lampadaire && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lampadaire</Text>
          <Text style={styles.infoValue}>{wo.lampadaire.reference} — {wo.lampadaire.zone}</Text>
          <StatusBadge type="etat" value={wo.lampadaire.etat} small />
        </View>
      )}
      {wo.zone && !wo.lampadaire && (
        <View style={styles.zoneRow}>
          <MapPin size={12} color="#94a3b8" />
          <Text style={styles.zone}>{wo.zone}</Text>
        </View>
      )}
      {wo.alert && (
        <View style={styles.alertRow}>
          <AlertTriangle size={13} color="#fca5a5" />
          <Text style={styles.alertText} numberOfLines={2}>{wo.alert.message}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', flex: 1 },
  id: { color: '#64748b', fontSize: 12, marginLeft: 8 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  availableBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#22c55e22', borderWidth: 1, borderColor: '#22c55e' },
  availableText: { color: '#22c55e', fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoLabel: { color: '#64748b', fontSize: 11 },
  infoValue: { color: '#94a3b8', fontSize: 12, flex: 1 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  zone: { color: '#94a3b8', fontSize: 12 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, padding: 8, backgroundColor: '#ef444415', borderRadius: 8 },
  alertText: { color: '#fca5a5', fontSize: 12, flex: 1 },
})
