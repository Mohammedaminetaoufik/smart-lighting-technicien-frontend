export type Palette = {
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  textMuted: string
  accent: string
  success: string
  warning: string
  danger: string
  brand: string
  // Extended
  bgDeep: string
  surfaceCard: string
  accentSoft: string
  successSoft: string
  warningSoft: string
  dangerSoft: string
  cyan: string
  purple: string
  tabBar: string
  tabBarBorder: string
}

export const dark: Palette = {
  bg:          '#0a0f1e',
  surface:     '#111827',
  surface2:    '#1a2235',
  border:      '#1e293b',
  text:        '#f0f6ff',
  textMuted:   '#64748b',
  accent:      '#3b82f6',
  success:     '#10b981',
  warning:     '#f59e0b',
  danger:      '#ef4444',
  brand:       '#10b981',
  // Extended
  bgDeep:      '#060b18',
  surfaceCard: '#0f1a2e',
  accentSoft:  '#3b82f615',
  successSoft: '#10b98115',
  warningSoft: '#f59e0b15',
  dangerSoft:  '#ef444415',
  cyan:        '#06b6d4',
  purple:      '#8b5cf6',
  tabBar:      '#0d1525e8',
  tabBarBorder:'#1e293b',
}

export const light: Palette = {
  bg:          '#f0f4ff',
  surface:     '#ffffff',
  surface2:    '#f1f5f9',
  border:      '#e2e8f0',
  text:        '#0f172a',
  textMuted:   '#64748b',
  accent:      '#2563eb',
  success:     '#059669',
  warning:     '#d97706',
  danger:      '#dc2626',
  brand:       '#059669',
  // Extended
  bgDeep:      '#e8eef8',
  surfaceCard: '#ffffff',
  accentSoft:  '#2563eb12',
  successSoft: '#05966912',
  warningSoft: '#d9770612',
  dangerSoft:  '#dc262612',
  cyan:        '#0891b2',
  purple:      '#7c3aed',
  tabBar:      '#fffffff0',
  tabBarBorder:'#e2e8f0',
}

export const themes = { dark, light }
