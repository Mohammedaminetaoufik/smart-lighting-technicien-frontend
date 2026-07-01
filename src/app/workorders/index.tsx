import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, ScrollView, Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, SlidersHorizontal, ChevronRight, Zap } from 'lucide-react-native'
import { getMyWorkOrders } from '../../api/workorders'
import { WorkOrderCard } from '../../components/WorkOrderCard'
import { OfflineBanner } from '../../components/OfflineBanner'
import { TabBar } from '../../components/ui/TabBar'
import { PRIORITY_COLORS } from '../../constants/config'
import { useThemeStore } from '../../store/themeStore'
import { Palette } from '../../constants/theme'

const STATUSES = ['Tous', 'accepted', 'in_progress', 'resolved', 'created']
const STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepté', in_progress: 'En cours', resolved: 'Résolu', created: 'Créé',
}

const PRIORITIES = ['Tous', 'critical', 'high', 'medium', 'low']
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Basse',
}

type Scope = 'all' | 'mine' | 'available'
const SCOPES: { key: Scope; label: string; color: string }[] = [
  { key: 'all',       label: 'Toutes',         color: '#64748b' },
  { key: 'mine',      label: 'Mes missions',    color: '#3b82f6' },
  { key: 'available', label: 'Disponibles',     color: '#10b981' },
]

export default function WorkOrdersScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ status?: string; priority?: string }>()
  const [statusFilter,   setStatusFilter]   = useState(params.status   ?? 'Tous')
  const [priorityFilter, setPriorityFilter] = useState(params.priority ?? 'Tous')
  const [scope, setScope] = useState<Scope>('all')

  const { palette } = useThemeStore()
  const styles = React.useMemo(() => createStyles(palette), [palette])

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['workorders', scope, statusFilter, priorityFilter],
    queryFn: () => getMyWorkOrders({
      scope,
      ...(statusFilter   !== 'Tous' ? { status: statusFilter }     : {}),
      ...(priorityFilter !== 'Tous' ? { priority: priorityFilter } : {}),
    }),
  })

  const workOrders = data?.work_orders ?? []
  const activeScope = SCOPES.find(s => s.key === scope)!

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Interventions</Text>
          <Text style={styles.headerSub}>{workOrders.length} bon{workOrders.length !== 1 ? 's' : ''} de travail</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: activeScope.color + '18', borderColor: activeScope.color + '40' }]}>
          <Zap size={11} color={activeScope.color} />
          <Text style={[styles.headerBadgeText, { color: activeScope.color }]}>{activeScope.label}</Text>
        </View>
      </View>

      {/* ── Scope tabs ─────────────────────────────────────── */}
      <View style={styles.scopeRow}>
        {SCOPES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.scopeTab, scope === s.key && { backgroundColor: s.color + '18', borderColor: s.color + '60' }]}
            onPress={() => setScope(s.key)}
            activeOpacity={0.7}
          >
            {scope === s.key && <View style={[styles.scopeDot, { backgroundColor: s.color }]} />}
            <Text style={[styles.scopeText, scope === s.key && { color: s.color, fontWeight: '700' }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <View style={styles.filterIcon}>
          <SlidersHorizontal size={13} color={palette.textMuted} />
        </View>

        {/* Status chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.chipsRow}>
            {STATUSES.map((s) => {
              const isActive = statusFilter === s
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, isActive && { backgroundColor: palette.accent + '18', borderColor: palette.accent + '60' }]}
                  onPress={() => setStatusFilter(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && { color: palette.accent, fontWeight: '700' }]}>
                    {STATUS_LABELS[s] ?? s}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Priority chips ─────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityScroll}>
        <View style={styles.chipsRow}>
          {PRIORITIES.map((p) => {
            const isActive = priorityFilter === p
            const color = PRIORITY_COLORS[p] ?? palette.textMuted
            return (
              <TouchableOpacity
                key={p}
                style={[styles.chip, isActive && { backgroundColor: color + '15', borderColor: color + '60' }]}
                onPress={() => setPriorityFilter(p)}
                activeOpacity={0.7}
              >
                <View style={[styles.priorityDot, { backgroundColor: color, opacity: isActive ? 1 : 0.5 }]} />
                <Text style={[styles.chipText, isActive && { color, fontWeight: '700' }]}>
                  {PRIORITY_LABELS[p] ?? p}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* ── List ───────────────────────────────────────────── */}
      <FlatList
        data={workOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.accent} />
        }
        renderItem={({ item }) => (
          <WorkOrderCard
            workOrder={item}
            onPress={() => router.push(`/workorders/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <ClipboardList size={28} color={palette.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune intervention</Text>
            <Text style={styles.emptySub}>
              {scope === 'mine'
                ? 'Vos interventions assignées apparaîtront ici'
                : scope === 'available'
                ? 'Aucune intervention disponible pour le moment'
                : 'Aucun bon de travail ne correspond à ce filtre'}
            </Text>
          </View>
        }
      />

      <TabBar active="workorders" />
    </View>
  )
}

const createStyles = (p: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: p.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 16 : 12, paddingBottom: 8,
  },
  headerTitle:    { color: p.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:      { color: p.textMuted, fontSize: 12, marginTop: 1 },
  headerBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  headerBadgeText:{ fontSize: 11, fontWeight: '700' },

  scopeRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  scopeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 8, borderRadius: 10,
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.border,
  },
  scopeDot: { width: 5, height: 5, borderRadius: 3 },
  scopeText:{ color: p.textMuted, fontSize: 12, fontWeight: '600' },

  filterBar:     { flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingBottom: 4 },
  filterIcon:    { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  filterScroll:  { flexGrow: 0 },
  priorityScroll:{ flexGrow: 0, paddingLeft: 12, paddingBottom: 6 },
  chipsRow:      { flexDirection: 'row', paddingRight: 12, gap: 6, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, gap: 5,
  },
  chipText:    { color: p.textMuted, fontSize: 11, fontWeight: '600' },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },

  list: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },

  empty:       { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconBox:{ width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  emptyTitle:  { color: p.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub:    { color: p.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
})
