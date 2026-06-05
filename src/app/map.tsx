import React, { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native'
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps'
import * as Location from 'expo-location'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Radio, Lightbulb, MapPin, LocateFixed, RefreshCw,
  Stethoscope, X, Wifi, WifiOff, Wrench, AlertTriangle, Crosshair,
  Search, Layers, ChevronRight, ChevronLeft, Eye,
} from 'lucide-react-native'
import { getMapLampadaires, getMapLCUs, getMapConnections } from '../api/map'

/* ── couleurs ─────────────────────────────────────────────── */
const STATUS_HEX: Record<string, string> = {
  online: '#22c55e', offline: '#ef4444', maintenance: '#f59e0b',
}
const STATUS_LABEL: Record<string, string> = {
  online: 'En ligne', offline: 'Hors ligne', maintenance: 'Maintenance',
}
const STATUS_ICON: Record<string, React.FC<any>> = {
  online: Wifi, offline: WifiOff, maintenance: Wrench,
}

/* ── fonds de carte ───────────────────────────────────────── */
const TILES: Record<string, { url: string; maxZoom: number }> = {
  'Dark Pro':  { url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',  maxZoom: 20 },
  'Clair':     { url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', maxZoom: 20 },
  'Satellite': { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 },
}
const TILE_KEYS = Object.keys(TILES)

/* ── Marker Lampadaire ────────────────────────────────────── */
const LampMarker = ({ lamp, selected }: { lamp: any; selected: boolean }) => {
  const isLit   = (lamp.intensite ?? 0) > 0
  const color   = STATUS_HEX[lamp.etat] ?? '#6b7280'
  const size    = selected ? 22 : 15
  const outer   = size + 10
  return (
    <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: outer, height: outer, borderRadius: outer / 2,
        borderWidth: 2, borderColor: color, opacity: isLit ? 0.7 : 0.3,
      }} />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isLit ? '#22c55e' : '#374151',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#fff' : 'rgba(255,255,255,0.35)',
        shadowColor: isLit ? '#22c55e' : '#000',
        shadowOpacity: isLit ? 0.9 : 0.3, shadowRadius: isLit ? 8 : 3, elevation: isLit ? 8 : 2,
      }} />
    </View>
  )
}

/* ── Marker LCU ───────────────────────────────────────────── */
const LCUMarker = ({ lcu, count, selected }: { lcu: any; count: number; selected: boolean }) => (
  <View style={[mk.lcuBox, selected && mk.lcuBoxSel]}>
    <Radio size={11} color="#fff" />
    <Text style={mk.lcuText}>{lcu.reference || lcu.name}</Text>
    <View style={mk.badge}><Text style={mk.badgeText}>{count}</Text></View>
  </View>
)
const mk = StyleSheet.create({
  lcuBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1e40af', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
  },
  lcuBoxSel: { borderColor: '#fff', shadowOpacity: 0.9, shadowRadius: 14 },
  lcuText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
})

/* ── Écran principal ──────────────────────────────────────── */
export default function MapScreen() {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)
  const [pos, setPos]       = useState<{ latitude: number; longitude: number } | null>(null)
  const [selected, setSel]  = useState<{ type: 'lamp' | 'lcu'; data: any } | null>(null)
  const [filters, setFil]   = useState({ online: true, offline: true, maintenance: true })
  const [tile, setTile]     = useState('Dark Pro')
  const [search, setSearch] = useState('')
  const [sidebar, setSidebar] = useState(false)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      setPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
    })()
  }, [])

  const { data: lampsData, isLoading, refetch } = useQuery({
    queryKey: ['map-lamps'], queryFn: () => getMapLampadaires(), refetchInterval: 60_000,
  })
  const { data: lcusData } = useQuery({
    queryKey: ['map-lcus'], queryFn: () => getMapLCUs(), refetchInterval: 60_000,
  })
  const { data: connsData } = useQuery({
    queryKey: ['map-connections'], queryFn: () => getMapConnections(), refetchInterval: 120_000,
  })

  const allLamps = lampsData?.lampadaires ?? []
  const lcus     = lcusData?.lcus         ?? []
  const conns    = connsData?.connections  ?? []

  const q = search.trim().toLowerCase()
  const matchSearch = (l: any) => !q || l.reference?.toLowerCase().includes(q) || l.zone?.toLowerCase().includes(q)

  const lamps = useMemo(() =>
    allLamps.filter((l: any) => filters[l.etat as keyof typeof filters] !== false && matchSearch(l)),
    [allLamps, filters, q])

  const filteredLCUs = useMemo(() =>
    lcus.filter((l: any) => !q || (l.reference || l.name || '').toLowerCase().includes(q) || (l.zone || '').toLowerCase().includes(q)),
    [lcus, q])

  const lampsByLCU = useMemo(() => {
    const m: Record<number, any[]> = {}
    allLamps.forEach((l: any) => { if (l.lcu_id) { m[l.lcu_id] = m[l.lcu_id] ?? []; m[l.lcu_id].push(l) } })
    return m
  }, [allLamps])

  const stats = useMemo(() => ({
    online:      allLamps.filter((l: any) => l.etat === 'online').length,
    offline:     allLamps.filter((l: any) => l.etat === 'offline').length,
    maintenance: allLamps.filter((l: any) => l.etat === 'maintenance').length,
    lit:         allLamps.filter((l: any) => (l.intensite ?? 0) > 0).length,
  }), [allLamps])

  const center = pos ?? { latitude: 33.9911, longitude: -6.8494 }
  const flyTo  = (lat: number, lng: number, delta = 0.005) =>
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta }, 800)

  const focusLamp = (l: any) => {
    setSel({ type: 'lamp', data: l }); setSidebar(false)
    if (l.latitude && l.longitude) flyTo(l.latitude, l.longitude, 0.003)
  }
  const focusLCU = (l: any) => {
    setSel({ type: 'lcu', data: l }); setSidebar(false)
    if (l.latitude && l.longitude) flyTo(l.latitude, l.longitude, 0.006)
  }

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        showsUserLocation={!!pos}
        showsMyLocationButton={false}
        onPress={() => setSel(null)}
      >
        <UrlTile key={tile} urlTemplate={TILES[tile].url} maximumZ={TILES[tile].maxZoom} flipY={false} tileSize={256} />

        {/* Connexions LCU vers Lampe */}
        {conns.map((c: any, i: number) => {
          const lcu  = lcus.find((l: any) => l.id === c.lcu_id)
          const lamp = lamps.find((l: any) => l.id === c.lampadaire_id)
          if (!lcu?.latitude || !lamp?.latitude) return null
          return (
            <Polyline key={i}
              coordinates={[{ latitude: lcu.latitude, longitude: lcu.longitude }, { latitude: lamp.latitude, longitude: lamp.longitude }]}
              strokeColor="#3b82f680" strokeWidth={1} lineDashPattern={[6, 4]} />
          )
        })}

        {/* Lampadaires */}
        {lamps.map((l: any) => {
          if (!l.latitude || !l.longitude) return null
          const isSel = selected?.type === 'lamp' && selected.data.id === l.id
          return (
            <Marker key={`l-${l.id}`}
              coordinate={{ latitude: l.latitude, longitude: l.longitude }}
              onPress={(e) => { e.stopPropagation(); setSel({ type: 'lamp', data: l }) }}
              tracksViewChanges={false}
              zIndex={isSel ? 200 : l.has_critical_alert ? 100 : 1}
            >
              <LampMarker lamp={l} selected={isSel} />
            </Marker>
          )
        })}

        {/* LCUs */}
        {lcus.map((lcu: any) => {
          if (!lcu.latitude || !lcu.longitude) return null
          const isSel = selected?.type === 'lcu' && selected.data.id === lcu.id
          return (
            <Marker key={`lcu-${lcu.id}`}
              coordinate={{ latitude: lcu.latitude, longitude: lcu.longitude }}
              onPress={(e) => { e.stopPropagation(); setSel({ type: 'lcu', data: lcu }) }}
              tracksViewChanges={false} zIndex={isSel ? 300 : 50} anchor={{ x: 0.5, y: 1 }}
            >
              <LCUMarker lcu={lcu} count={lampsByLCU[lcu.id]?.length ?? 0} selected={isSel} />
            </Marker>
          )
        })}
      </MapView>

      {/* ── Barre stats ── */}
      <View style={s.statsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsInner}>
          {([
            { key: 'online',      Icon: Wifi,     color: '#22c55e', count: stats.online      },
            { key: 'offline',     Icon: WifiOff,  color: '#ef4444', count: stats.offline     },
            { key: 'maintenance', Icon: Wrench,   color: '#f59e0b', count: stats.maintenance },
          ] as const).map(({ key, Icon, color, count }) => (
            <TouchableOpacity key={key}
              onPress={() => setFil(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
              style={[s.chip, { borderColor: color + '55' }, filters[key as keyof typeof filters] ? { backgroundColor: color + '20' } : { opacity: 0.4 }]}>
              <Icon size={12} color={color} />
              <Text style={[s.chipText, { color }]}>{count}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.sep} />
          <View style={[s.chip, { backgroundColor: '#3b82f620', borderColor: '#3b82f655' }]}>
            <Radio size={12} color="#60a5fa" />
            <Text style={[s.chipText, { color: '#60a5fa' }]}>{lcus.length} LCUs</Text>
          </View>
          <View style={[s.chip, { backgroundColor: '#22c55e20', borderColor: '#22c55e55' }]}>
            <Lightbulb size={12} color="#4ade80" />
            <Text style={[s.chipText, { color: '#4ade80' }]}>{stats.lit} allumés</Text>
          </View>
        </ScrollView>
      </View>

      {/* ── Boutons flottants ── */}
      <TouchableOpacity style={s.fab} onPress={() => refetch()}>
        {isLoading ? <ActivityIndicator size="small" color="#22c55e" /> : <RefreshCw size={18} color="#f1f5f9" />}
      </TouchableOpacity>
      {pos && (
        <TouchableOpacity style={[s.fab, { top: 122 }]} onPress={() => flyTo(pos.latitude, pos.longitude, 0.01)}>
          <LocateFixed size={18} color="#f1f5f9" />
        </TouchableOpacity>
      )}

      {/* ── Bouton ouvrir sidebar (gauche) ── */}
      {!sidebar && (
        <TouchableOpacity style={s.sidebarToggle} onPress={() => setSidebar(true)}>
          <Layers size={16} color="#f1f5f9" />
          <ChevronRight size={14} color="#94a3b8" />
        </TouchableOpacity>
      )}

      {/* ── Sidebar coulissante ── */}
      {sidebar && (
        <View style={s.sidebar}>
          {/* Header + recherche */}
          <View style={s.sbHeader}>
            <View style={s.sbTitleRow}>
              <Layers size={15} color="#22c55e" />
              <Text style={s.sbTitle}>Réseau</Text>
              <TouchableOpacity style={s.sbClose} onPress={() => setSidebar(false)}>
                <ChevronLeft size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View style={s.searchBox}>
              <Search size={15} color="#64748b" />
              <TextInput
                style={s.searchInput}
                placeholder="Référence, zone…"
                placeholderTextColor="#64748b"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}><X size={15} color="#64748b" /></TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Fond de carte */}
            <View style={s.sbSection}>
              <Text style={s.sbSectionTitle}>Fond de carte</Text>
              <View style={s.tileRow}>
                {TILE_KEYS.map((k) => (
                  <TouchableOpacity key={k}
                    style={[s.tileBtn, tile === k && s.tileBtnActive]}
                    onPress={() => setTile(k)}>
                    <Text style={[s.tileBtnText, tile === k && s.tileBtnTextActive]}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* LCUs */}
            <View style={s.sbSection}>
              <View style={s.sbSectionHead}>
                <Radio size={12} color="#60a5fa" />
                <Text style={s.sbSectionTitle}>Passerelles LCU</Text>
                <Text style={s.sbCount}>{filteredLCUs.length}</Text>
              </View>
              {filteredLCUs.map((lcu: any) => {
                const cnt = lampsByLCU[lcu.id]?.length ?? 0
                const lit = (lampsByLCU[lcu.id] ?? []).filter((x: any) => (x.intensite ?? 0) > 0).length
                return (
                  <TouchableOpacity key={lcu.id} style={s.sbRow} onPress={() => focusLCU(lcu)}>
                    <Radio size={12} color="#60a5fa" />
                    <Text style={s.sbRef}>{lcu.reference || lcu.name}</Text>
                    <Text style={s.sbMeta}><Text style={{ color: '#22c55e' }}>{lit}</Text>/{cnt}</Text>
                    <Eye size={13} color="#475569" />
                  </TouchableOpacity>
                )
              })}
              {filteredLCUs.length === 0 && <Text style={s.sbEmpty}>Aucune LCU</Text>}
            </View>

            {/* Lampadaires */}
            <View style={s.sbSection}>
              <View style={s.sbSectionHead}>
                <Lightbulb size={12} color="#facc15" />
                <Text style={s.sbSectionTitle}>Lampadaires</Text>
                <Text style={s.sbCount}>{lamps.length}</Text>
              </View>
              {lamps.slice(0, 100).map((l: any) => {
                const c = STATUS_HEX[l.etat] ?? '#6b7280'
                const isLit = (l.intensite ?? 0) > 0
                return (
                  <TouchableOpacity key={l.id} style={s.sbRow} onPress={() => focusLamp(l)}>
                    <View style={[s.sbDot, { backgroundColor: c }]} />
                    <Lightbulb size={12} color={isLit ? '#22c55e' : '#64748b'} />
                    <Text style={s.sbRef}>{l.reference}</Text>
                    {l.has_critical_alert && <AlertTriangle size={11} color="#ef4444" />}
                    <Text style={s.sbMeta}>{l.intensite ?? 0}%</Text>
                    <Eye size={13} color="#475569" />
                  </TouchableOpacity>
                )
              })}
              {lamps.length > 100 && <Text style={s.sbEmpty}>+{lamps.length - 100} autres — affinez la recherche</Text>}
              {lamps.length === 0 && <Text style={s.sbEmpty}>Aucun lampadaire</Text>}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Légende ── */}
      <View style={s.legend}>
        <Text style={s.legendTitle}>LÉGENDE</Text>
        {[
          { dot: '#22c55e', glow: true,  label: 'Allumé (ON)' },
          { dot: '#374151', glow: false, label: 'Éteint (OFF)' },
        ].map((r) => (
          <View key={r.label} style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: r.dot, ...(r.glow ? { shadowColor: '#22c55e', shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 } : {}) }]} />
            <Text style={s.legendText}>{r.label}</Text>
          </View>
        ))}
        {['online', 'offline', 'maintenance'].map((k) => (
          <View key={k} style={s.legendRow}>
            <View style={[s.legendRing, { borderColor: STATUS_HEX[k] }]} />
            <Text style={s.legendText}>{STATUS_LABEL[k]}</Text>
          </View>
        ))}
        <View style={s.legendRow}>
          <View style={s.legendLCU} />
          <Text style={s.legendText}>Passerelle LCU</Text>
        </View>
      </View>

      {/* ── Panel Lampadaire ── */}
      {selected?.type === 'lamp' && (() => {
        const l     = selected.data
        const color = STATUS_HEX[l.etat] ?? '#6b7280'
        const isLit = (l.intensite ?? 0) > 0
        const StatusIcon = STATUS_ICON[l.etat] ?? Wifi
        return (
          <View style={s.panel}>
            <View style={s.panelHeader}>
              <View style={[s.panelIconBox, { backgroundColor: color + '22' }]}>
                <Lightbulb size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.panelTitle}>{l.reference}</Text>
                <View style={s.badgeRow}>
                  <View style={[s.badge, { backgroundColor: color + '20', borderColor: color + '55' }]}>
                    <StatusIcon size={10} color={color} />
                    <Text style={[s.badgeText, { color }]}>{STATUS_LABEL[l.etat] ?? l.etat}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: (isLit ? '#22c55e' : '#374151') + '20', borderColor: (isLit ? '#22c55e' : '#374151') + '55' }]}>
                    <Lightbulb size={10} color={isLit ? '#22c55e' : '#6b7280'} />
                    <Text style={[s.badgeText, { color: isLit ? '#22c55e' : '#9ca3af' }]}>{isLit ? 'Allumé' : 'Éteint'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSel(null)} style={s.closeBtn}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={s.grid}>
              {[
                { label: 'Zone',      value: l.zone || '—' },
                { label: 'Intensité', value: `${l.intensite ?? 0}%`, color: isLit ? '#22c55e' : '#9ca3af' },
                { label: 'Puissance', value: l.puissance ? `${l.puissance} W` : '—' },
                { label: 'LCU',       value: l.lcu_id ? `#${l.lcu_id}` : '—' },
              ].map((item) => (
                <View key={item.label} style={s.cell}>
                  <Text style={s.cellLabel}>{item.label}</Text>
                  <Text style={[s.cellValue, item.color ? { color: item.color } : {}]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {l.has_critical_alert && (
              <View style={s.alertRow}>
                <AlertTriangle size={13} color="#fca5a5" />
                <Text style={s.alertText}>Alerte critique active</Text>
              </View>
            )}

            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => flyTo(l.latitude, l.longitude, 0.002)}>
                <Crosshair size={14} color="#f1f5f9" />
                <Text style={s.actionBtnText}>Centrer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnBlue]} onPress={() => router.push(`/diagnostic/${l.id}` as never)}>
                <Stethoscope size={14} color="#60a5fa" />
                <Text style={[s.actionBtnText, { color: '#60a5fa' }]}>Diagnostic</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      })()}

      {/* ── Panel LCU ── */}
      {selected?.type === 'lcu' && (() => {
        const lcu    = selected.data
        const lamps_ = lampsByLCU[lcu.id] ?? []
        const onCnt  = lamps_.filter((l: any) => l.etat === 'online').length
        const litCnt = lamps_.filter((l: any) => (l.intensite ?? 0) > 0).length
        return (
          <View style={s.panel}>
            <View style={s.panelHeader}>
              <View style={[s.panelIconBox, { backgroundColor: '#3b82f622' }]}>
                <Radio size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.panelTitle}>{lcu.reference || lcu.name}</Text>
                <Text style={s.panelSub}>{lcu.ip_address}{lcu.zone ? ` · ${lcu.zone}` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => setSel(null)} style={s.closeBtn}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={s.grid}>
              {[
                { label: 'Lampadaires', value: String(lamps_.length) },
                { label: 'En ligne',    value: String(onCnt),  color: '#22c55e' },
                { label: 'Allumés',     value: String(litCnt), color: '#22c55e' },
                { label: 'Statut',      value: lcu.status ?? '—' },
              ].map((item) => (
                <View key={item.label} style={s.cell}>
                  <Text style={s.cellLabel}>{item.label}</Text>
                  <Text style={[s.cellValue, item.color ? { color: item.color } : {}]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {lamps_.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {lamps_.map((l: any) => {
                  const c = STATUS_HEX[l.etat] ?? '#6b7280'
                  return (
                    <TouchableOpacity key={l.id}
                      style={[s.lampChip, { borderColor: c + '55', backgroundColor: c + '11' }]}
                      onPress={() => { setSel({ type: 'lamp', data: l }); flyTo(l.latitude, l.longitude) }}>
                      <View style={[s.lampChipDot, { backgroundColor: c }]} />
                      <Text style={[s.lampChipText, { color: c }]}>{l.reference}</Text>
                      <Text style={s.lampChipInt}>{l.intensite ?? 0}%</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}

            <TouchableOpacity style={[s.actionBtn, { marginTop: 10 }]}
              onPress={() => lcu.latitude && flyTo(lcu.latitude, lcu.longitude, 0.003)}>
              <Crosshair size={14} color="#f1f5f9" />
              <Text style={s.actionBtnText}>Centrer sur la LCU</Text>
            </TouchableOpacity>
          </View>
        )
      })()}
    </View>
  )
}

/* ── Styles ───────────────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  statsBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 10, paddingBottom: 6,
    backgroundColor: 'rgba(15,23,42,0.90)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statsInner: { paddingHorizontal: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700' },
  sep: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 2 },
  fab: {
    position: 'absolute', top: 72, right: 12,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(15,23,42,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  legend: {
    position: 'absolute', bottom: 16, right: 12,
    backgroundColor: 'rgba(15,23,42,0.92)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 155,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  legendTitle: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendRing: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: 'transparent' },
  legendLCU: { width: 24, height: 10, borderRadius: 3, backgroundColor: '#1e40af', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  legendText: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 16, paddingBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  panelIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '700', fontFamily: 'monospace', marginBottom: 4 },
  panelSub: { color: '#64748b', fontSize: 12 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cell: { flex: 1, minWidth: '45%', backgroundColor: '#1e293b', borderRadius: 10, padding: 10 },
  cellLabel: { color: '#64748b', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  cellValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef444415', borderRadius: 8, padding: 8, marginBottom: 8 },
  alertText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  actionBtnBlue: { flex: 2, backgroundColor: '#3b82f620', borderColor: '#3b82f655' },
  actionBtnText: { color: '#f1f5f9', fontSize: 13, fontWeight: '600' },
  lampChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 6 },
  lampChipDot: { width: 6, height: 6, borderRadius: 3 },
  lampChipText: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  lampChipInt: { color: '#64748b', fontSize: 10 },

  /* ── Sidebar ── */
  sidebarToggle: {
    position: 'absolute', top: '50%', left: 0, marginTop: -28,
    width: 30, height: 56, borderTopRightRadius: 14, borderBottomRightRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.95)', borderWidth: 1, borderLeftWidth: 0, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  sidebar: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 290,
    backgroundColor: 'rgba(13,18,32,0.98)',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  sbHeader: { paddingTop: 14, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  sbTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sbTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', flex: 1 },
  sbClose: { padding: 4, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#f1f5f9', fontSize: 13, padding: 0 },
  sbSection: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sbSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sbSectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  sbCount: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  sbRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },
  sbDot: { width: 6, height: 6, borderRadius: 3 },
  sbRef: { color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace', flex: 1 },
  sbMeta: { color: '#64748b', fontSize: 11 },
  sbEmpty: { color: '#475569', fontSize: 11, textAlign: 'center', paddingVertical: 10 },
  tileRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tileBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  tileBtnActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  tileBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tileBtnTextActive: { color: '#fff' },
})
