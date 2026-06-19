import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import {
  getAILampadaireDiagnostic,
  getAILCUDiagnostic,
  getAIWorkOrderDiagnostic,
} from '../api/ai'
import { useThemeStore } from '../store/themeStore'
import { Palette } from '../constants/theme'

type EntityType = 'lampadaire' | 'lcu' | 'workorder'

interface Props {
  entityType: EntityType
  entityId: string | number
}

const PRIORITY_CONFIG = {
  critical: { label: 'Critique',  bg: '#ef444420', text: '#ef4444', dot: '#ef4444' },
  high:     { label: 'Élevé',     bg: '#f59e0b20', text: '#f59e0b', dot: '#f59e0b' },
  medium:   { label: 'Moyen',     bg: '#3b82f620', text: '#3b82f6', dot: '#3b82f6' },
  low:      { label: 'Faible',    bg: '#64748b20', text: '#94a3b8', dot: '#64748b' },
}

function fetchDiagnostic(entityType: EntityType, entityId: string | number) {
  if (entityType === 'lampadaire') return getAILampadaireDiagnostic(entityId)
  if (entityType === 'lcu')        return getAILCUDiagnostic(entityId)
  return getAIWorkOrderDiagnostic(entityId)
}

export default function AIFieldDiagnostic({ entityType, entityId }: Props) {
  const { palette } = useThemeStore()
  const styles      = makeStyles(palette)
  const [expanded, setExpanded]   = useState(false)
  const [checked, setChecked]     = useState<Record<number, boolean>>({})

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ai-field-diagnostic', entityType, entityId],
    queryFn:  () => fetchDiagnostic(entityType, entityId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Graceful degradation: if the endpoint doesn't exist, the component just hides itself
  })

  // Don't render anything if errored (endpoint not yet available / 404)
  if (isError) return null

  const priority   = data?.priority ?? 'medium'
  const pcfg       = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const checklist  = data?.checklist ?? []
  const tools      = data?.tools_required ?? []
  const confidence = data ? Math.round(data.confidence * 100) : null

  const toggleCheck = (i: number) =>
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }))

  return (
    <View style={styles.container}>
      {/* Header — always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.priorityDot, { backgroundColor: pcfg.dot }]} />
          <Text style={styles.headerTitle}>Diagnostic terrain IA</Text>
          {isLoading && <ActivityIndicator size="small" color={palette.accent} style={{ marginLeft: 8 }} />}
        </View>
        <View style={styles.headerRight}>
          {data && (
            <View style={[styles.priorityBadge, { backgroundColor: pcfg.bg }]}>
              <Text style={[styles.priorityLabel, { color: pcfg.text }]}>{pcfg.label}</Text>
            </View>
          )}
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && data && (
        <View style={styles.body}>
          {/* Cause probable + confiance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cause probable</Text>
            <Text style={styles.causeText}>{data.probable_cause}</Text>
            {confidence !== null && (
              <View style={styles.confidenceRow}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${confidence}%` as any }]} />
                </View>
                <Text style={styles.confidenceLabel}>{confidence}% confiance</Text>
              </View>
            )}
          </View>

          {/* Impact */}
          {data.impact && Object.keys(data.impact).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Impact</Text>
              <View style={styles.impactChips}>
                {Object.entries(data.impact)
                  .filter(([, v]) => v !== null && v !== undefined && v !== 'inconnu')
                  .map(([k, v]) => (
                    <View key={k} style={styles.chip}>
                      <Text style={styles.chipText}>{String(v)} {k.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Checklist terrain</Text>
              {checklist.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.checkItem}
                  onPress={() => toggleCheck(i)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
                    {checked[i] && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checkLabel, checked[i] && styles.checkLabelDone]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Matériel requis */}
          {tools.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Matériel recommandé</Text>
              <View style={styles.toolsGrid}>
                {tools.map((t, i) => (
                  <View key={i} style={styles.toolChip}>
                    <Text style={styles.toolText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Résultat attendu */}
          {data.expected_result && (
            <View style={[styles.section, styles.resultSection]}>
              <Text style={styles.sectionTitle}>Résultat attendu</Text>
              <Text style={styles.resultText}>{data.expected_result}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

function makeStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      backgroundColor: p.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      overflow: 'hidden',
      marginVertical: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: p.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priorityBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    priorityLabel: {
      fontSize: 11,
      fontWeight: '700',
    },
    chevron: {
      fontSize: 10,
      color: p.textMuted,
    },
    body: {
      borderTopWidth: 1,
      borderTopColor: p.border,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    section: {
      paddingTop: 14,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: p.textMuted,
      marginBottom: 8,
    },
    causeText: {
      fontSize: 13,
      color: p.text,
      lineHeight: 20,
    },
    confidenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    confidenceBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.surface2,
      overflow: 'hidden',
    },
    confidenceFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: '#22c55e',
    },
    confidenceLabel: {
      fontSize: 11,
      color: p.textMuted,
    },
    impactChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: p.surface2,
      borderWidth: 1,
      borderColor: p.border,
    },
    chipText: {
      fontSize: 11,
      color: p.text,
      fontWeight: '600',
    },
    checkItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: p.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: '#22c55e',
      borderColor: '#22c55e',
    },
    checkmark: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '700',
    },
    checkLabel: {
      flex: 1,
      fontSize: 13,
      color: p.text,
      lineHeight: 20,
    },
    checkLabelDone: {
      color: p.textMuted,
      textDecorationLine: 'line-through',
    },
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    toolChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: p.surface2,
      borderWidth: 1,
      borderColor: p.border,
    },
    toolText: {
      fontSize: 12,
      color: p.textMuted,
    },
    resultSection: {
      backgroundColor: p.surface2,
      borderRadius: 10,
      padding: 12,
      marginTop: 14,
    },
    resultText: {
      fontSize: 13,
      color: p.text,
      lineHeight: 20,
    },
  })
}
