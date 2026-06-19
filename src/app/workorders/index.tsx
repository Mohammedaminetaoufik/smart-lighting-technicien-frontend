import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Filter } from 'lucide-react-native'
import { getMyWorkOrders } from '../../api/workorders'
import { WorkOrderCard } from '../../components/WorkOrderCard'
import { OfflineBanner } from '../../components/OfflineBanner'
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
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'mine', label: 'Mes interventions' },
  { key: 'available', label: 'Disponibles' },
]

export default function WorkOrdersScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ status?: string; priority?: string }>()
  const [statusFilter, setStatusFilter] = useState(params.status ?? 'Tous')
  const [priorityFilter, setPriorityFilter] = useState(params.priority ?? 'Tous')
  const [scope, setScope] = useState<Scope>('all')

  const { palette } = useThemeStore()
  const styles = React.useMemo(() => createStyles(palette), [palette])

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['workorders', scope, statusFilter, priorityFilter],
    queryFn: () => getMyWorkOrders({
      scope,
      ...(statusFilter !== 'Tous' ? { status: statusFilter } : {}),
      ...(priorityFilter !== 'Tous' ? { priority: priorityFilter } : {}),
    }),
  })

  const workOrders = data?.work_orders ?? []

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* Scope filter tabs */}
      <View style={styles.tabs}>
        {SCOPES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.tab, scope === s.key && styles.tabActive]}
            onPress={() => setScope(s.key)}
          >
            <Text style={[styles.tabText, scope === s.key && styles.tabTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filtersContainer}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, statusFilter === s && styles.chipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                {STATUS_LABELS[s] ?? s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
{/* Priority filter chips */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
  <View style={styles.filtersContainer}>
    <Filter size={14} color={palette.textMuted} style={{ marginRight: 4 }} />
    {/* Priority filter chips */}
    {PRIORITIES.map((p) => {
      const isActive = priorityFilter === p
      const color = PRIORITY_COLORS[p] ?? palette.textMuted
      return (
        <TouchableOpacity
          key={p}
          style={[
            styles.chip,
            isActive && { backgroundColor: `${color}15`, borderColor: color }
          ]}
          onPress={() => setPriorityFilter(p)}
        >
          <View style={[styles.priorityDot, { backgroundColor: color }]} />
          <Text style={[styles.chipText, isActive && { color }]}>
            {PRIORITY_LABELS[p] ?? p}
          </Text>
        </TouchableOpacity>
      )
    })}
  </View>
</ScrollView>


      <FlatList
        data={workOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={palette.brand} />}
        renderItem={({ item }) => (
          <WorkOrderCard workOrder={item} onPress={() => router.push(`/workorders/${item.id}` as never)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <ClipboardList size={28} color={palette.textMuted} />
            </View>

            <Text style={styles.emptyText}>Aucune intervention</Text>
            <Text style={styles.emptySubText}>
              {scope === 'mine'
                ? 'Vos interventions assignées apparaîtront ici'
                : scope === 'available'
                ? 'Les interventions disponibles à prendre apparaîtront ici'
                : 'Les bons de travail apparaîtront ici'}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const createStyles = (p: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: p.bg },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border },
  tabActive: { backgroundColor: p.brand + '22', borderColor: p.brand },
  tabText: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: p.brand },
  filterScroll: { flexGrow: 0, paddingVertical: 4 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, alignItems: 'center' },
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    backgroundColor: p.surface, 
    borderWidth: 1, 
    borderColor: p.border,
    gap: 6
  },
  chipActive: { backgroundColor: p.accent + '15', borderColor: p.accent },
  chipText: { color: p.textMuted, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: p.accent },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: p.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubText: { color: p.textMuted, fontSize: 13 },
})
