import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, asyncPersister } from '../lib/offline'
import { useSyncStore } from '../store/syncStore'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useBootstrap } from '../hooks/useBootstrap'

const WEEK = 1000 * 60 * 60 * 24 * 7

function BackgroundWorkers() {
  useOfflineSync()   // pousse la file d'actions au retour du réseau
  useBootstrap()     // télécharge tout le contenu quand en ligne
  return null
}

export default function RootLayout() {
  const { loadFromStorage } = useSyncStore()
  useEffect(() => { loadFromStorage() }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncPersister, maxAge: WEEK }}
    >
      <BackgroundWorkers />
      <StatusBar style="light" backgroundColor="#0f172a" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0f172a' },
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
