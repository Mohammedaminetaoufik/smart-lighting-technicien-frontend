import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSyncStore } from '../store/syncStore'
import { useOfflineSync } from '../hooks/useOfflineSync'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function SyncWatcher() {
  useOfflineSync()
  return null
}

export default function RootLayout() {
  const { loadFromStorage } = useSyncStore()
  useEffect(() => { loadFromStorage() }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SyncWatcher />
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
        <Stack.Screen name="diagnostic/[id]" options={{ title: 'Diagnostic' }} />
        <Stack.Screen name="sync" options={{ title: 'Synchronisation' }} />
      </Stack>
    </QueryClientProvider>
  )
}
