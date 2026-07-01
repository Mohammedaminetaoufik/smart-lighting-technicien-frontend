import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = '@sl_tech_token'
const USER_KEY  = '@sl_tech_user'

interface AuthUser {
  id:    number
  name:  string
  email: string
  role:  string
}

interface AuthStore {
  token: string | null
  user:  AuthUser | null
  login:           (user: AuthUser, token: string) => Promise<void>
  logout:          () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user:  null,

  login: async (user, token) => {
    await AsyncStorage.setItem(TOKEN_KEY, token)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    await AsyncStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },

  loadFromStorage: async () => {
    try {
      const [token, userRaw] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ])
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
      set({ token, user })
    } catch {}
  },
}))
