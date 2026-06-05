import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, Wrench, AlertTriangle, CheckCircle2,
  Map as MapIcon, RefreshCw, ChevronRight, Clock, Wifi, WifiOff,
  Lightbulb, Radio, Stethoscope, MapPin,
} from 'lucide-react-native'
import { getDashboard } from '../api/workorders'
import { OfflineBanner } from '../components/OfflineBanner'
import { StatusBadge } from '../components/StatusBadge'
import { useSyncStore } from '../store/syncStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export default function DashboardScreen() {
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const { pendingActions, lastSyncAt } = useSyncStore()

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const stats = data?.stats ?? {}
  const mapSummary = data?.map_summary ?? {}
  const nextWO = data?.next_work_order
  const importantAlerts = data?.important_alerts ?? []

  const kpis = [
    { label: 'Assignées',    value: stats.assigned        ?? 0, color: '#3b82f6', Icon: ClipboardList, route: '/workorders' },
    { label: 'Urgentes',     value: stats.urgent          ?? 0, color: '#ef4444', Icon: AlertTriangle, route: '/workorders?priority=critical' },
    { label: 'En cours',     value: stats.in_progress     ?? 0, color: '#f59e0b', Icon: Wrench,        route: '/workorders?status=in_progress' },
    { label: 'Terminées (j)',value: stats.completed_today ?? 0, color: '#22c55e', Icon: CheckCircle2,  route: null as string | null },
  ]

  const quickNav = [
    { label: 'Interventions',  Icon: ClipboardList, route: '/workorders',   color: '#3b82f6' },
    { label: 'Carte',          Icon: MapIcon,       route: '/map',          color: '#22c55e' },
    { label: 'Lampadaires',    Icon: Lightbulb,     route: '/lampadaires',  color: '#f59e0b' },
    { label: 'LCUs',           Icon: Radio,         route: '/lcus',         color: '#8b5cf6' },
    { label: 'Mise en service',Icon: Wrench,        route: '/commissioning',color: '#06b6d4' },
    { label: 'Synchronisation',Icon: RefreshCw,     route: '/sync',         color: '#64748b' },
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
          <View>
            <Text style={styles.greeting}>Bonjour, Technicien #{data?.technician_id ?? 1}</Text>
            <Text style={styles.subGreeting}>
              {lastSyncAt ? `Sync : ${new Date(lastSyncAt).toLocaleTimeString('fr-FR')}` : 'Jamais synchronisé'}
            </Text>
          </View>
          <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#22c55e22' : '#ef444422' }]}>
            {isOnline ? <Wifi size={12} color="#22c55e" /> : <WifiOff size={12} color="#ef4444" />}
            <Text style={[styles.onlineText, { color: isOnline ? '#22c55e' : '#ef4444' }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>

        {/* Pending sync banner */}
        {pendingActions.length > 0 && (
          <TouchableOpacity style={styles.syncCard} onPress={() => router.push('/sync')}>
            <View style={styles.syncCardLeft}>
              <Clock size={18} color="#fbbf24" />
              <Text style={styles.syncTitle}>{pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} en attente</Text>
            </View>
            <ChevronRight size={18} color="#d97706" />
          </TouchableOpacity>
        )}

        {/* KPI grid */}
        <View style={styles.grid}>
          {kpis.map(({ label, value, color, Icon, route }) => (
            <TouchableOpacity key={label} style={[styles.statCard, { borderColor: color + '44' }]}
              onPress={() => route && router.push(route as never)} disabled={!route} activeOpacity={route ? 0.8 : 1}>
              <View style={[styles.statIconBox, { backgroundColor: color + '1a' }]}><Icon size={18} color={color} /></View>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prochaine intervention */}
        {nextWO && (
          <>
            <Text style={styles.sectionTitle}>Prochaine intervention</Text>
            <TouchableOpacity style={styles.nextCard} onPress={() => router.push(`/workorders/${nextWO.id}` as never)}>
              <View style={styles.nextTop}>
                <Text style={styles.nextTitle} numberOfLines={1}>{nextWO.title}</Text>
                <Text style={styles.nextId}>#{nextWO.id}</Text>
              </View>
              <View style={styles.nextBadges}>
                <StatusBadge type="status" value={nextWO.status} small />
                <StatusBadge type="priority" value={nextWO.priority} small />
              </View>
              {nextWO.lampadaire && (
                <View style={styles.nextLamp}>
                  <Lightbulb size={13} color="#94a3b8" />
                  <Text style={styles.nextLampText}>{nextWO.lampadaire.reference} — {nextWO.lampadaire.zone}</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Résumé carte */}
        <Text style={styles.sectionTitle}>Résumé carte terrain</Text>
        <View style={styles.mapSummary}>
          {[
            { Icon: MapPin, label: 'Assignés', value: mapSummary.assigned_lampadaires ?? 0, color: '#3b82f6' },
            { Icon: Radio, label: 'LCUs', value: mapSummary.nearby_lcus ?? 0, color: '#8b5cf6' },
            { Icon: AlertTriangle, label: 'Alertes', value: mapSummary.critical_alerts ?? 0, color: '#ef4444' },
            { Icon: MapPin, label: 'Sans GPS', value: mapSummary.missing_location ?? 0, color: '#f59e0b' },
          ].map(({ Icon, label, value, color }) => (
            <View key={label} style={styles.mapCell}>
              <Icon size={15} color={color} />
              <Text style={styles.mapValue}>{value}</Text>
              <Text style={styles.mapLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Alertes importantes */}
        {importantAlerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alertes importantes</Text>
            {importantAlerts.map((a: any) => (
              <View key={a.id} style={styles.alertCard}>
                <AlertTriangle size={16} color="#fca5a5" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertMsg} numberOfLines={2}>{a.message}</Text>
                  {a.lampadaire_reference ? <Text style={styles.alertMeta}>{a.lampadaire_reference}{a.zone ? ` · ${a.zone}` : ''}</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Navigation rapide */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.navGrid}>
          {quickNav.map(({ label, Icon, route, color }) => (
            <TouchableOpacity key={label} style={styles.navBtn} onPress={() => router.push(route as never)}>
              <View style={[styles.navIcon, { backgroundColor: color + '1a' }]}><Icon size={20} color={color} /></View>
              <Text style={styles.navText}>{label}</Text>
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
  header: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  subGreeting: { color: '#64748b', fontSize: 12, marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  onlineText: { fontSize: 12, fontWeight: '600' },
  syncCard: { backgroundColor: '#f59e0b18', borderColor: '#f59e0b44', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncTitle: { color: '#fbbf24', fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  statCard: { width: '46%', backgroundColor: '#1e293b', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  nextCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  nextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nextTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', flex: 1 },
  nextId: { color: '#64748b', fontSize: 12, marginLeft: 8 },
  nextBadges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  nextLamp: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextLampText: { color: '#94a3b8', fontSize: 12 },
  mapSummary: { flexDirection: 'row', gap: 8 },
  mapCell: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#334155' },
  mapValue: { color: '#f1f5f9', fontSize: 18, fontWeight: '800' },
  mapLabel: { color: '#64748b', fontSize: 10 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ef444412', borderColor: '#ef444433', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  alertMsg: { color: '#fca5a5', fontSize: 13, fontWeight: '500' },
  alertMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  navBtn: { width: '46%', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#334155' },
  navIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600', flex: 1 },
})
