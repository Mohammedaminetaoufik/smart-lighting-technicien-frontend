import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, asyncPersister } from '../lib/offline'
import { useSyncStore } from '../store/syncStore'
import { useThemeStore } from '../store/themeStore'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useBootstrap } from '../hooks/useBootstrap'

const WEEK = 1000 * 60 * 60 * 24 * 7

function BackgroundWorkers() {
  useOfflineSync()   // pousse la file d'actions au retour du réseau
  useBootstrap()     // télécharge tout le contenu quand en ligne
  return null
}

export default function RootLayout() {
  const { loadFromStorage: loadSync } = useSyncStore()
  const { loadFromStorage: loadTheme, mode, palette } = useThemeStore()

  useEffect(() => {
    loadSync()
    loadTheme()
  }, [])

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
        <Stack.Screen name="sync" options={{ title: 'Synchronisation' }} />
      </Stack>
    </PersistQueryClientProvider>
  )
}
