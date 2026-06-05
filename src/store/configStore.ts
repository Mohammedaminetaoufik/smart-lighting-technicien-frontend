import { create } from 'zustand'
import { DEFAULT_TECHNICIAN_ID, API_URL } from '../constants/config'

interface ConfigStore {
  technicianId: number
  apiUrl: string
  setTechnicianId: (id: number) => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  technicianId: DEFAULT_TECHNICIAN_ID,
  apiUrl: API_URL,
  setTechnicianId: (id) => set({ technicianId: id }),
}))
