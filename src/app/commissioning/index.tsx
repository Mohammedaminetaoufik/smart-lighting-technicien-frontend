import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Wrench, ChevronRight, MapPin, CheckCircle2 } from 'lucide-react-native'
import { getCommissioningTasks } from '../../api/commissioning'
import { COMMISSIONING_LABEL, COMMISSIONING_COLOR } from '../../constants/config'

const STEPS = ['discovered', 'located', 'configured', 'tested', 'commissioned']
const FILTERS = ['Tous', 'discovered', 'located', 'tested', 'failed']

export default function CommissioningScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState('Tous')

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['commissioning', filter],
    queryFn: () => getCommissioningTasks(filter !== 'Tous' ? filter : undefined),
  })
  const tasks = data?.tasks ?? []

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.tab, filter === f && styles.tabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === 'Tous' ? 'Tous' : COMMISSIONING_LABEL[f] ?? f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
        ListHeaderComponent={<Text style={styles.count}>{tasks.length} lampadaire{tasks.length > 1 ? 's' : ''} à mettre en service</Text>}
        renderItem={({ item }) => {
          const color = COMMISSIONING_COLOR[item.commissioning_status] ?? '#6b7280'
          const stepIdx = STEPS.indexOf(item.commissioning_status)
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/commissioning/${item.id}` as never)} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: color + '1a' }]}>
                  {item.commissioning_status === 'commissioned'
                    ? <CheckCircle2 size={18} color={color} />
                    : <Wrench size={18} color={color} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ref}>{item.reference}</Text>
                  <View style={styles.metaRow}>
                    <MapPin size={11} color="#64748b" />
                    <Text style={styles.zone}>{item.zone || '—'}{item.lcu_reference ? `  ·  ${item.lcu_reference}` : ''}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: color + '1a' }]}>
                  <Text style={[styles.badgeText, { color }]}>{COMMISSIONING_LABEL[item.commissioning_status] ?? item.commissioning_status}</Text>
                </View>
                <ChevronRight size={16} color="#475569" />
              </View>
              {/* Stepper */}
              <View style={styles.stepper}>
                {STEPS.map((s, i) => (
                  <View key={s} style={styles.stepWrap}>
                    <View style={[styles.stepDot, i <= stepIdx ? { backgroundColor: color } : { backgroundColor: '#334155' }]} />
                    {i < STEPS.length - 1 && <View style={[styles.stepLine, i < stepIdx ? { backgroundColor: color } : { backgroundColor: '#334155' }]} />}
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><CheckCircle2 size={28} color="#22c55e" /></View>
            <Text style={styles.emptyText}>Aucune mise en service en attente</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 10, gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#22c55e' },
  list: { padding: 12 },
  count: { color: '#64748b', fontSize: 12, marginBottom: 8, paddingHorizontal: 2 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ref: { color: '#f1f5f9', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  zone: { color: '#94a3b8', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 4 },
  stepWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#22c55e15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', textAlign: 'center' },
})
