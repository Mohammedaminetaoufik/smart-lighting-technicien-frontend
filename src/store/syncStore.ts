import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SYNC_ACTIONS } from '../constants/config'

export interface SyncAction {
  local_id: string
  type: string
  entity: string
  entity_id: number
  payload: Record<string, unknown>
  created_at: string
}

interface SyncStore {
  pendingActions: SyncAction[]
  lastSyncAt: string | null
  addAction: (action: Omit<SyncAction, 'local_id' | 'created_at'>) => void
  removeActions: (localIds: string[]) => void
  setLastSyncAt: (date: string) => void
  loadFromStorage: () => Promise<void>
}

let _actionCounter = 0
const genLocalId = (type: string): string => {
  _actionCounter++
  return `local_${type.toLowerCase()}_${Date.now()}_${_actionCounter}`
}

const STORAGE_KEY = 'sync_pending_actions'

export const useSyncStore = create<SyncStore>((set, get) => ({
  pendingActions: [],
  lastSyncAt: null,

  addAction: (action) => {
    const newAction: SyncAction = {
      ...action,
      local_id: genLocalId(action.type),
      created_at: new Date().toISOString(),
    }
    const updated = [...get().pendingActions, newAction]
    set({ pendingActions: updated })
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
  },

  removeActions: (localIds) => {
    const updated = get().pendingActions.filter((a) => !localIds.includes(a.local_id))
    set({ pendingActions: updated })
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
  },

  setLastSyncAt: (date) => set({ lastSyncAt: date }),

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ pendingActions: JSON.parse(stored) })
      }
    } catch {}
  },
}))

export { SYNC_ACTIONS }
