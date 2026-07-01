import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList, Wrench, AlertTriangle, CheckCircle2,
  MapPin, ChevronRight, Lightbulb, Radio, RefreshCw,
  Wifi, WifiOff, Clock, User,
} from 'lucide-react-native'
import { getDashboard } from '../api/workorders'
import { OfflineBanner } from '../components/OfflineBanner'
import { StatusBadge } from '../components/StatusBadge'
import { TabBar } from '../components/ui/TabBar'
import { useSyncStore } from '../store/syncStore'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { Palette } from '../constants/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const { isOnline } = useNetworkStatus()
  const { pendingActions, lastSyncAt } = useSyncStore()
  const { palette } = useThemeStore()
  const { user } = useAuthStore()

  const styles = React.useMemo(() => createStyles(palette), [palette])

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const stats       = data?.stats ?? {}
  const mapSummary  = data?.map_summary ?? {}
  const nextWO      = data?.next_work_order
  const importantAlerts = data?.important_alerts ?? []

  const kpis = [
    { label: 'Assignées',     value: stats.assigned        ?? 0, color: '#3b82f6', Icon: ClipboardList, route: '/workorders' },
    { label: 'Urgentes',      value: stats.urgent          ?? 0, color: '#ef4444', Icon: AlertTriangle, route: '/workorders?priority=critical' },
    { label: 'En cours',      value: stats.in_progress     ?? 0, color: '#f59e0b', Icon: Wrench,        route: '/workorders?status=in_progress' },
    { label: "Aujourd'hui",   value: stats.completed_today ?? 0, color: '#10b981', Icon: CheckCircle2,  route: null as string | null },
  ]

  const quickNav = [
    { label: 'Interventions',   Icon: ClipboardList, route: '/workorders',    color: '#3b82f6' },
    { label: 'Lampadaires',     Icon: Lightbulb,     route: '/lampadaires',   color: '#f59e0b' },
    { label: 'LCUs',            Icon: Radio,          route: '/lcus',          color: '#8b5cf6' },
    { label: 'Mise en service', Icon: Wrench,         route: '/commissioning', color: '#06b6d4' },
    { label: 'Synchronisation', Icon: RefreshCw,      route: '/sync',          color: '#64748b' },
  ]

  const initials = (user?.name ?? 'T')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.accent} />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header ─────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Background glow */}
          <View style={[styles.heroGlow, { backgroundColor: palette.accent + '0a' }]} />

          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>{greeting},</Text>
              <Text style={styles.heroName} numberOfLines={1}>{user?.name ?? 'Technicien'}</Text>
              {lastSyncAt && (
                <View style={styles.syncRow}>
                  <Clock size={10} color={palette.textMuted} />
                  <Text style={styles.syncText}>
                    Sync {new Date(lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </View>

            {/* Avatar button → profile */}
            <TouchableOpacity
              style={[styles.avatarBtn, { backgroundColor: palette.accent + '18', borderColor: palette.accent + '40' }]}
              onPress={() => router.push('/profile' as never)}
              activeOpacity={0.8}
            >
              <Text style={[styles.avatarText, { color: palette.accent }]}>{initials}</Text>
            </TouchableOpacity>
          </View>

          {/* Status row */}
          <View style={styles.heroStatusRow}>
            <View style={[styles.onlinePill, {
              backgroundColor: isOnline ? '#10b98118' : '#ef444418',
              borderColor:     isOnline ? '#10b98140' : '#ef444440',
            }]}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
              {isOnline
                ? <Wifi    size={11} color="#10b981" />
                : <WifiOff size={11} color="#ef4444" />}
              <Text style={[styles.onlineLabel, { color: isOnline ? '#10b981' : '#ef4444' }]}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </Text>
            </View>

            {pendingActions.length > 0 && (
              <TouchableOpacity
                style={styles.pendingPill}
                onPress={() => router.push('/sync' as never)}
              >
                <Clock size={11} color="#f59e0b" />
                <Text style={styles.pendingLabel}>{pendingActions.length} en attente</Text>
                <ChevronRight size={11} color="#f59e0b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── KPI grid ────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Mes interventions</Text>
        <View style={styles.kpiGrid}>
          {kpis.map(({ label, value, color, Icon, route }) => (
            <TouchableOpacity
              key={label}
              style={[styles.kpiCard, { borderColor: color + '30' }]}
              onPress={() => route && router.push(route as never)}
              disabled={!route}
              activeOpacity={route ? 0.75 : 1}
            >
              {/* Glow bg */}
              <View style={[styles.kpiGlow, { backgroundColor: color + '0c' }]} />

              <View style={[styles.kpiIconBox, { backgroundColor: color + '1a' }]}>
                <Icon size={17} color={color} strokeWidth={2} />
              </View>
              <Text style={[styles.kpiValue, { color }]}>{value}</Text>
              <Text style={styles.kpiLabel}>{label}</Text>

              {route && (
                <View style={styles.kpiArrow}>
                  <ChevronRight size={12} color={color + '80'} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Prochaine intervention ───────────────────────────── */}
        {nextWO && (
          <>
            <Text style={styles.sectionTitle}>Prochaine intervention</Text>
            <TouchableOpacity
              style={styles.nextCard}
              onPress={() => router.push(`/workorders/${nextWO.id}` as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.nextAccent, { backgroundColor: '#3b82f6' }]} />
              <View style={styles.nextBody}>
                <View style={styles.nextTop}>
                  <Text style={styles.nextTitle} numberOfLines={1}>{nextWO.title}</Text>
                  <Text style={styles.nextId}>#{nextWO.id}</Text>
                </View>
                <View style={styles.nextBadges}>
                  <StatusBadge type="status"   value={nextWO.status}   small />
                  <StatusBadge type="priority" value={nextWO.priority} small />
                </View>
                {nextWO.lampadaire && (
                  <View style={styles.nextLamp}>
                    <Lightbulb size={12} color={palette.textMuted} />
                    <Text style={styles.nextLampText}>
                      {nextWO.lampadaire.reference} — {nextWO.lampadaire.zone}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight size={18} color={palette.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* ── Map summary ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Résumé terrain</Text>
        <View style={styles.mapRow}>
          {[
            { Icon: MapPin,        label: 'Assignés',  value: mapSummary.assigned_lampadaires ?? 0, color: '#3b82f6' },
            { Icon: Radio,         label: 'LCUs',      value: mapSummary.nearby_lcus ?? 0,         color: '#8b5cf6' },
            { Icon: AlertTriangle, label: 'Alertes',   value: mapSummary.critical_alerts ?? 0,      color: '#ef4444' },
            { Icon: MapPin,        label: 'Sans GPS',  value: mapSummary.missing_location ?? 0,     color: '#f59e0b' },
          ].map(({ Icon, label, value, color }) => (
            <View key={label} style={[styles.mapCell, { borderColor: color + '25' }]}>
              <View style={[styles.mapCellIcon, { backgroundColor: color + '18' }]}>
                <Icon size={14} color={color} />
              </View>
              <Text style={[styles.mapValue, { color }]}>{value}</Text>
              <Text style={styles.mapLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Alertes importantes ──────────────────────────────── */}
        {importantAlerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alertes critiques</Text>
            {importantAlerts.map((a: any) => (
              <View key={a.id} style={styles.alertCard}>
                <View style={[styles.alertIcon, { backgroundColor: '#ef444418' }]}>
                  <AlertTriangle size={15} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertMsg} numberOfLines={2}>{a.message}</Text>
                  {a.lampadaire_reference && (
                    <Text style={styles.alertMeta}>
                      {a.lampadaire_reference}{a.zone ? ` · ${a.zone}` : ''}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Quick nav ───────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.navGrid}>
          {quickNav.map(({ label, Icon, route, color }) => (
            <TouchableOpacity
              key={label}
              style={styles.navBtn}
              onPress={() => router.push(route as never)}
              activeOpacity={0.75}
            >
              <View style={[styles.navIcon, { backgroundColor: color + '18' }]}>
                <Icon size={19} color={color} strokeWidth={2} />
              </View>
              <Text style={styles.navText}>{label}</Text>
              <ChevronRight size={14} color={palette.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Profile shortcut */}
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/profile' as never)}
            activeOpacity={0.75}
          >
            <View style={[styles.navIcon, { backgroundColor: '#10b98118' }]}>
              <User size={19} color="#10b981" strokeWidth={2} />
            </View>
            <Text style={styles.navText}>Mon profil</Text>
            <ChevronRight size={14} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TabBar active="dashboard" />
    </View>
  )
}

const createStyles = (p: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: p.bg },
  scroll:    { paddingBottom: 20 },

  // Hero
  hero: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 56 : 20,
    marginBottom: 8,
    backgroundColor: p.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: p.border,
    overflow: 'hidden',
    padding: 18,
  },
  heroGlow:     { position: 'absolute', inset: 0 },
  heroTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  heroGreeting: { color: p.textMuted, fontSize: 13, fontWeight: '500' },
  heroName:     { color: p.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 1 },
  syncRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  syncText:     { color: p.textMuted, fontSize: 11 },
  avatarBtn:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText:   { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  heroStatusRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  onlinePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  onlineDot:    { width: 5, height: 5, borderRadius: 3 },
  onlineLabel:  { fontSize: 11, fontWeight: '600' },
  pendingPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f59e0b15', borderWidth: 1, borderColor: '#f59e0b40' },
  pendingLabel: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },

  // Section titles
  sectionTitle: { color: p.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 22, marginBottom: 10, paddingHorizontal: 16 },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  kpiCard: {
    width: '47%', backgroundColor: p.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, overflow: 'hidden', position: 'relative',
  },
  kpiGlow:    { position: 'absolute', inset: 0 },
  kpiIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue:   { fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 36 },
  kpiLabel:   { color: p.textMuted, fontSize: 11, fontWeight: '500', marginTop: 3 },
  kpiArrow:   { position: 'absolute', top: 10, right: 10 },

  // Next work order
  nextCard: {
    marginHorizontal: 16, backgroundColor: p.surface, borderRadius: 14,
    borderWidth: 1, borderColor: p.border,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  nextAccent: { width: 3, alignSelf: 'stretch' },
  nextBody:   { flex: 1, padding: 14 },
  nextTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  nextTitle:  { color: p.text, fontSize: 14, fontWeight: '700', flex: 1 },
  nextId:     { color: p.textMuted, fontSize: 12, marginLeft: 8 },
  nextBadges: { flexDirection: 'row', gap: 6, marginBottom: 7 },
  nextLamp:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nextLampText: { color: p.textMuted, fontSize: 11 },

  // Map summary
  mapRow:     { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  mapCell:    { flex: 1, backgroundColor: p.surface, borderRadius: 12, padding: 12, alignItems: 'center', gap: 5, borderWidth: 1 },
  mapCellIcon:{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mapValue:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  mapLabel:   { color: p.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', textAlign: 'center' },

  // Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#ef444410', borderColor: '#ef444430', borderWidth: 1,
    borderRadius: 12, padding: 12,
  },
  alertIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertMsg:   { color: '#fca5a5', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  alertMeta:  { color: p.textMuted, fontSize: 11, marginTop: 2 },

  // Quick nav
  navGrid: { paddingHorizontal: 16, gap: 8 },
  navBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: p.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: p.border,
  },
  navIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navText: { flex: 1, color: p.text, fontSize: 14, fontWeight: '600' },
})
