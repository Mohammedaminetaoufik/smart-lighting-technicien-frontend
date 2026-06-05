import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { STATUS_COLORS, PRIORITY_COLORS } from '../constants/config'

const STATUS_LABELS: Record<string, string> = {
  created: 'Créé', open: 'Ouvert', accepted: 'Accepté',
  in_progress: 'En cours', resolved: 'Résolu', closed: 'Clos', cancelled: 'Annulé',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critique', high: 'Élevée', medium: 'Moyenne', low: 'Faible',
}

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'etat'
  value: string
  small?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, small }) => {
  let color = '#6b7280'
  let label = value

  if (type === 'status') {
    color = STATUS_COLORS[value] ?? '#6b7280'
    label = STATUS_LABELS[value] ?? value
  } else if (type === 'priority') {
    color = PRIORITY_COLORS[value] ?? '#6b7280'
    label = PRIORITY_LABELS[value] ?? value
  } else if (type === 'etat') {
    const ETAT = { online: '#22c55e', offline: '#ef4444', maintenance: '#f59e0b' } as Record<string,string>
    const ETAT_L = { online: 'En ligne', offline: 'Hors ligne', maintenance: 'Maintenance' } as Record<string,string>
    color = ETAT[value] ?? '#6b7280'
    label = ETAT_L[value] ?? value
  }

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, small && styles.smallText]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
  smallText: { fontSize: 10 },
})
