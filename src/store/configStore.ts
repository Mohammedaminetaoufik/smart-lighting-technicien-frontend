import { create } from 'zustand'
import { API_URL } from '../constants/config'

interface ConfigStore {
  apiUrl: string
}

export const useConfigStore = create<ConfigStore>(() => ({
  apiUrl: API_URL,
}))
