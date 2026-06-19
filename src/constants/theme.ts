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
}

export const dark: Palette = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#334155',
  border: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  brand: '#22c55e',
}

export const light: Palette = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  brand: '#22c55e',
}

export const themes = { dark, light }
