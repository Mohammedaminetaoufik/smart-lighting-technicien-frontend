export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8081'
export const DEFAULT_TECHNICIAN_ID = Number(process.env.EXPO_PUBLIC_DEFAULT_TECHNICIAN_ID ?? '1')

export const SYNC_ACTIONS = {
  ACCEPT_WORK_ORDER:         'ACCEPT_WORK_ORDER',
  START_WORK_ORDER:          'START_WORK_ORDER',
  ADD_NOTE:                  'ADD_NOTE',
  RESOLVE_WORK_ORDER:        'RESOLVE_WORK_ORDER',
  BLOCK_WORK_ORDER:          'BLOCK_WORK_ORDER',
  UPDATE_LOCATION:           'UPDATE_LOCATION',
  UPDATE_CHECKLIST_ITEM:     'UPDATE_CHECKLIST_ITEM',
  CREATE_CHECKLIST:          'CREATE_CHECKLIST',
  ADD_PHOTO_METADATA:        'ADD_PHOTO_METADATA',
  COMPLETE_COMMISSIONING_STEP: 'COMPLETE_COMMISSIONING_STEP',
} as const

export const STATUS_COLORS: Record<string, string> = {
  created:     '#6b7280',
  open:        '#6b7280',
  accepted:    '#3b82f6',
  in_progress: '#f59e0b',
  resolved:    '#22c55e',
  closed:      '#10b981',
  cancelled:   '#ef4444',
}

export const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#3b82f6',
  low:      '#6b7280',
}

export const ETAT_COLORS: Record<string, string> = {
  online:      '#22c55e',
  offline:     '#ef4444',
  maintenance: '#f59e0b',
}
