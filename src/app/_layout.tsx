import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, asyncPersister } from '../lib/offline'
import { useSyncStore } from '../store/syncStore'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useBootstrap } from '../hooks/useBootstrap'

const WEEK = 1000 * 60 * 60 * 24 * 7

function BackgroundWorkers() {
  useOfflineSync()
  useBootstrap()
  return null
}

export default function RootLayout() {
  const { loadFromStorage: loadSync } = useSyncStore()
  const { loadFromStorage: loadTheme, mode, palette } = useThemeStore()
  const { loadFromStorage: loadAuth, token } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([loadSync(), loadTheme(), loadAuth()]).finally(() => setReady(true))
  }, [])

  // Redirect to login once we know there's no token
  useEffect(() => {
    if (ready && !token) {
      router.replace('/(auth)/login')
    }
  }, [ready, token])

  // Show spinner while loading from AsyncStorage
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncPersister, maxAge: WEEK }}
    >
      <BackgroundWorkers />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={palette.bg} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Tableau de bord', headerShown: false }} />
        <Stack.Screen name="workorders/index" options={{ title: 'Mes interventions' }} />
        <Stack.Screen name="workorders/[id]" options={{ title: 'Intervention' }} />
        <Stack.Screen name="map" options={{ title: 'Carte', headerShown: false }} />
        <Stack.Screen name="lampadaires/index" options={{ title: 'Lampadaires' }} />
        <Stack.Screen name="lampadaires/[id]" options={{ title: 'Lampadaire' }} />
        <Stack.Screen name="lcus/index" options={{ title: 'Passerelles LCU' }} />
        <Stack.Screen name="lcus/[id]" options={{ title: 'LCU' }} />
        <Stack.Screen name="commissioning/index" options={{ title: 'Mise en service' }} />
        <Stack.Screen name="commissioning/[id]" options={{ title: 'Mise en service' }} />
        <Stack.Screen name="diagnostic/[id]" options={{ title: 'Diagnostic' }} />
        <Stack.Screen name="sync"    options={{ title: 'Synchronisation' }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </PersistQueryClientProvider>
  )
}
