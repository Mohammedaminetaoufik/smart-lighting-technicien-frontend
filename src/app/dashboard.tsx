import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, Wrench, AlertTriangle, CheckCircle2,
  Map as MapIcon, RefreshCw, ChevronRight, Clock, Wifi, WifiOff,
} from 'lucide-react-native'
import { getDashboard } from '../api/workorders'
import { OfflineBanner } from '../components/OfflineBanner'
import { useSyncStore } from '../store/syncStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export default function DashboardScreen() {
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const { pendingActions } = useSyncStore()

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const stats = [
    { label: 'Assignées',    value: data?.assigned_count       ?? '—', color: '#3b82f6', Icon: ClipboardList, route: '/workorders?status=accepted' },
    { label: 'En cours',     value: data?.in_progress_count    ?? '—', color: '#f59e0b', Icon: Wrench,        route: '/workorders?status=in_progress' },
    { label: 'Urgentes',     value: data?.urgent_count         ?? '—', color: '#ef4444', Icon: AlertTriangle, route: '/workorders?priority=critical' },
    { label: 'Résolues (j)', value: data?.resolved_today_count ?? '—', color: '#22c55e', Icon: CheckCircle2,  route: null as string | null },
  ]

  const quickActions = [
    { label: 'Mes interventions', Icon: ClipboardList, route: '/workorders' },
    { label: 'Carte réseau',      Icon: MapIcon,       route: '/map' },
    { label: 'Synchroniser',      Icon: RefreshCw,     route: '/sync' },
  ]

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour, Technicien #{data?.technician_id ?? 1}</Text>
          <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#22c55e22' : '#ef444422' }]}>
            {isOnline ? <Wifi size={12} color="#22c55e" /> : <WifiOff size={12} color="#ef4444" />}
            <Text style={[styles.onlineText, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>

        {/* KPI grid */}
        <View style={styles.grid}>
          {stats.map(({ label, value, color, Icon, route }) => (
            <TouchableOpacity
              key={label}
              style={[styles.statCard, { borderColor: color + '44' }]}
              onPress={() => route && router.push(route as never)}
              disabled={!route}
              activeOpacity={route ? 0.8 : 1}
            >
              <View style={[styles.statIconBox, { backgroundColor: color + '1a' }]}>
                <Icon size={18} color={color} />
              </View>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending sync */}
        {pendingActions.length > 0 && (
          <TouchableOpacity style={styles.syncCard} onPress={() => router.push('/sync')}>
            <View style={styles.syncCardLeft}>
              <Clock size={18} color="#fbbf24" />
              <View>
                <Text style={styles.syncTitle}>
                  {pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} en attente
                </Text>
                <Text style={styles.syncSub}>Appuyer pour synchroniser</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#d97706" />
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actions}>
          {quickActions.map(({ label, Icon, route }) => (
            <TouchableOpacity key={label} style={styles.actionBtn} onPress={() => router.push(route as never)}>
              <View style={styles.actionIconBox}>
                <Icon size={18} color="#22c55e" />
              </View>
              <Text style={styles.actionText}>{label}</Text>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16 },
  header: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', flex: 1 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: '46%', backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 30, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  syncCard: {
    backgroundColor: '#f59e0b18', borderColor: '#f59e0b44', borderWidth: 1,
    borderRadius: 12, padding: 14, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  syncCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncTitle: { color: '#fbbf24', fontWeight: '700', fontSize: 14 },
  syncSub: { color: '#d97706', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  actions: { gap: 10 },
  actionBtn: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  actionIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#22c55e1a', alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#f1f5f9', fontSize: 15, fontWeight: '600', flex: 1 },
})
