import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Lightbulb, ChevronRight, AlertTriangle, Wifi, WifiOff, Wrench } from 'lucide-react-native'
import { getLampadaires } from '../../api/lampadaires'
import { ETAT_COLORS } from '../../constants/config'

const ETAT_LABEL: Record<string, string> = { online: 'En ligne', offline: 'Hors ligne', maintenance: 'Maintenance' }
const ETAT_ICON: Record<string, React.FC<any>> = { online: Wifi, offline: WifiOff, maintenance: Wrench }
const FILTERS = ['Tous', 'online', 'offline', 'maintenance']

export default function LampadairesScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [etat, setEtat] = useState('Tous')

  const { data, isRefetching, refetch } = useQuery({
    queryKey: ['lampadaires', etat, search],
    queryFn: () => getLampadaires({
      ...(etat !== 'Tous' ? { etat } : {}),
      ...(search ? { search } : {}),
    }),
  })

  const lamps = data?.lampadaires ?? []

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher (référence, zone)…"
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}><X size={18} color="#64748b" /></TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f}
            style={[styles.tab, etat === f && styles.tabActive]}
            onPress={() => setEtat(f)}>
            <Text style={[styles.tabText, etat === f && styles.tabTextActive]}>
              {f === 'Tous' ? 'Tous' : ETAT_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={lamps}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#22c55e" />}
        renderItem={({ item }) => {
          const color = ETAT_COLORS[item.etat] ?? '#6b7280'
          const Icon = ETAT_ICON[item.etat] ?? Wifi
          const isLit = (item.intensite ?? 0) > 0
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/lampadaires/${item.id}` as never)} activeOpacity={0.8}>
              <View style={[styles.iconBox, { backgroundColor: color + '1a' }]}>
                <Lightbulb size={18} color={isLit ? '#22c55e' : color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ref}>{item.reference}</Text>
                <Text style={styles.zone}>{item.zone || '—'}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.badge, { backgroundColor: color + '1a' }]}>
                  <Icon size={10} color={color} />
                  <Text style={[styles.badgeText, { color }]}>{ETAT_LABEL[item.etat] ?? item.etat}</Text>
                </View>
                <Text style={styles.intensity}>{item.intensite ?? 0}%</Text>
              </View>
              {item.has_critical_alert && <AlertTriangle size={14} color="#ef4444" />}
              <ChevronRight size={16} color="#475569" />
            </TouchableOpacity>
          )
        }}
        ListHeaderComponent={<Text style={styles.count}>{lamps.length} lampadaire{lamps.length > 1 ? 's' : ''}</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Lightbulb size={28} color="#475569" /></View>
            <Text style={styles.emptyText}>Aucun lampadaire</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 4 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  tabActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#22c55e' },
  list: { padding: 12 },
  count: { color: '#64748b', fontSize: 12, marginBottom: 8, paddingHorizontal: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ref: { color: '#f1f5f9', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  zone: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  intensity: { color: '#64748b', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
})
