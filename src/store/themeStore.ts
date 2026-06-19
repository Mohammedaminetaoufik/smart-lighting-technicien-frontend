import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { themes, Palette } from '../constants/theme'

interface ThemeStore {
  mode: 'dark' | 'light'
  palette: Palette
  toggleTheme: () => void
  setTheme: (mode: 'dark' | 'light') => void
  loadFromStorage: () => Promise<void>
}

const STORAGE_KEY = '@smart_lighting_theme_mode'

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  palette: themes.dark,

  toggleTheme: () => {
    const nextMode = get().mode === 'dark' ? 'light' : 'dark'
    set({ mode: nextMode, palette: themes[nextMode] })
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {})
  },

  setTheme: (mode) => {
    set({ mode, palette: themes[mode] })
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {})
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') {
        set({ mode: stored, palette: themes[stored] })
      }
    } catch {}
  },
}))
