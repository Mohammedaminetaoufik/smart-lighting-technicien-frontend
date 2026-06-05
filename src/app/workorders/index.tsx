import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react-native'
import { getMyWorkOrders } from '../../api/workorders'
import { WorkOrderCard } from '../../components/WorkOrderCard'
import { OfflineBanner } from '../../components/OfflineBanner'

const STATUSES = ['Tous', 'accepted', 'in_progress', 'resolved', 'created']
const STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepté', in_progress: 'En cours', resolved: 'Résolu', created: 'Créé',
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
  const [scope, setScope] = useState<Scope>('all')

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['workorders', scope, statusFilter],
    queryFn: () => getMyWorkOrders({
      scope,
      ...(statusFilter !== 'Tous' ? { status: statusFilter } : {}),
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
      <View style={styles.tabs}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, statusFilter === s && styles.tabActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.tabText, statusFilter === s && styles.tabTextActive]}>
              {STATUS_LABELS[s] ?? s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={workOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
        renderItem={({ item }) => (
          <WorkOrderCard workOrder={item} onPress={() => router.push(`/workorders/${item.id}` as never)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <ClipboardList size={28} color="#475569" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#22c55e' },
  list: { padding: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: '#f1f5f9', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubText: { color: '#64748b', fontSize: 13 },
})
