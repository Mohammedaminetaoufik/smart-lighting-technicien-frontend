export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8081'
export const DEFAULT_TECHNICIAN_ID = Number(process.env.EXPO_PUBLIC_DEFAULT_TECHNICIAN_ID ?? '1')

export const SYNC_ACTIONS = {
  ACCEPT_WORK_ORDER:                'ACCEPT_WORK_ORDER',
  START_WORK_ORDER:                 'START_WORK_ORDER',
  ADD_NOTE:                         'ADD_NOTE',
  RESOLVE_WORK_ORDER:               'RESOLVE_WORK_ORDER',
  BLOCK_WORK_ORDER:                 'BLOCK_WORK_ORDER',
  UPDATE_LOCATION:                  'UPDATE_LOCATION',
  ADD_LAMPADAIRE_FIELD_NOTE:        'ADD_LAMPADAIRE_FIELD_NOTE',
  ADD_LCU_FIELD_NOTE:               'ADD_LCU_FIELD_NOTE',
  TEST_LCU_CONNECTIVITY:            'TEST_LCU_CONNECTIVITY',
  SYNC_LCU:                         'SYNC_LCU',
  COMMISSIONING_UPDATE_GPS:         'COMMISSIONING_UPDATE_GPS',
  COMMISSIONING_TEST_COMMUNICATION: 'COMMISSIONING_TEST_COMMUNICATION',
  COMMISSIONING_TEST_DIMMING:       'COMMISSIONING_TEST_DIMMING',
  COMMISSIONING_VALIDATE:           'COMMISSIONING_VALIDATE',
  COMMISSIONING_FAIL:               'COMMISSIONING_FAIL',
  COMMISSIONING_ADD_NOTE:           'COMMISSIONING_ADD_NOTE',
} as const

export const COMMISSIONING_STEPS = ['discovered', 'located', 'configured', 'tested', 'commissioned'] as const

export const COMMISSIONING_LABEL: Record<string, string> = {
  discovered:   'Découvert',
  located:      'Localisé',
  configured:   'Configuré',
  tested:       'Testé',
  commissioned: 'Mis en service',
  failed:       'Échec',
}

export const COMMISSIONING_COLOR: Record<string, string> = {
  discovered:   '#6b7280',
  located:      '#f59e0b',
  configured:   '#8b5cf6',
  tested:       '#3b82f6',
  commissioned: '#22c55e',
  failed:       '#ef4444',
}

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
