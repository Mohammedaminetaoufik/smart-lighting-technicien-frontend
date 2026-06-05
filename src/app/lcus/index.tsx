import React from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Radio, ChevronRight } from 'lucide-react-native'
import { getLCUs } from '../../api/lcus'

const STATUS_COLOR: Record<string, string> = { online: '#22c55e', offline: '#ef4444', unknown: '#6b7280' }

export default function LCUsScreen() {
  const router = useRouter()
  const { data, isRefetching, refetch } = useQuery({ queryKey: ['lcus'], queryFn: getLCUs })
  const lcus = data?.lcus ?? []

  return (
    <View style={styles.container}>
      <FlatList
        data={lcus}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
        ListHeaderComponent={<Text style={styles.count}>{lcus.length} passerelle{lcus.length > 1 ? 's' : ''} LCU</Text>}
        renderItem={({ item }) => {
          const color = STATUS_COLOR[item.status] ?? '#6b7280'
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/lcus/${item.id}` as never)} activeOpacity={0.8}>
              <View style={styles.iconBox}><Radio size={18} color="#3b82f6" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ref}>{item.reference || item.name}</Text>
                <Text style={styles.ip}>{item.ip_address}{item.zone ? `  ·  ${item.zone}` : ''}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={styles.counts}>
                  <Text style={{ color: '#22c55e' }}>{item.online_count}</Text>
                  <Text style={{ color: '#64748b' }}>/{item.lampadaires_count}</Text>
                </Text>
              </View>
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Radio size={28} color="#475569" /></View>
            <Text style={styles.emptyText}>Aucune LCU</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 12 },
  count: { color: '#64748b', fontSize: 12, marginBottom: 8, paddingHorizontal: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#3b82f61a', alignItems: 'center', justifyContent: 'center' },
  ref: { color: '#f1f5f9', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  ip: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  counts: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
})
