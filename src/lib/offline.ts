import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { getDashboard, getMyWorkOrders, getWorkOrder } from '../api/workorders'
import { getMapLampadaires, getMapLCUs, getMapConnections } from '../api/map'
import { getLampadaires, getLampadaireDetails } from '../api/lampadaires'
import { getLCUs, getLCUDetails } from '../api/lcus'
import { getCommissioningTasks } from '../api/commissioning'
import { getDiagnostic } from '../api/diagnostic'

const WEEK = 1000 * 60 * 60 * 24 * 7

/**
 * QueryClient offline-first :
 *  - networkMode 'offlineFirst' : sert le cache immédiatement, tente le réseau en arrière-plan,
 *    et NE plante PAS hors ligne (renvoie les données en cache).
 *  - gcTime long (7 j) : les données ne sont pas purgées de la mémoire.
 *  - staleTime court : rafraîchit dès qu'on est en ligne.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: WEEK,
      staleTime: 30_000,
      retry: 1,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})

/** Persiste tout le cache des requêtes sur le téléphone (survit au redémarrage). */
export const asyncPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'TECH_QUERY_CACHE',
  throttleTime: 1000,
})

/**
 * Clés de requête centralisées — identiques à celles utilisées dans chaque écran,
 * pour que le prefetch alimente le même cache.
 */
export const QK = {
  dashboard:      ['dashboard'] as const,
  workorders:     ['workorders', 'Tous'] as const,
  mapLamps:       ['map-lamps'] as const,
  mapLcus:        ['map-lcus'] as const,
  mapConnections: ['map-connections'] as const,
  lampadaires:    ['lampadaires', 'Tous', ''] as const,
  lcus:           ['lcus'] as const,
  commissioning:  ['commissioning', 'Tous'] as const,
}

/**
 * Bootstrap : quand l'app s'ouvre EN LIGNE, on précharge TOUTES les données
 * (dashboard, interventions, lampadaires, LCUs, connexions, mise en service)
 * pour qu'elles soient disponibles HORS LIGNE même sans avoir ouvert chaque écran.
 * Les résultats alimentent le cache TanStack Query, lui-même persisté sur AsyncStorage.
 */
export async function runBootstrap(): Promise<void> {
  // ── Phase 1 : listes principales ──
  const wave1: Array<Promise<unknown>> = [
    queryClient.prefetchQuery({ queryKey: QK.dashboard,      queryFn: getDashboard }),
    queryClient.prefetchQuery({ queryKey: QK.workorders,     queryFn: () => getMyWorkOrders({}) }),
    queryClient.prefetchQuery({ queryKey: QK.mapLamps,       queryFn: () => getMapLampadaires() }),
    queryClient.prefetchQuery({ queryKey: QK.mapLcus,        queryFn: () => getMapLCUs() }),
    queryClient.prefetchQuery({ queryKey: QK.mapConnections, queryFn: () => getMapConnections() }),
    queryClient.prefetchQuery({ queryKey: QK.lampadaires,    queryFn: () => getLampadaires({}) }),
    queryClient.prefetchQuery({ queryKey: QK.lcus,           queryFn: () => getLCUs() }),
    queryClient.prefetchQuery({ queryKey: QK.commissioning,  queryFn: () => getCommissioningTasks(undefined) }),
  ]
  await Promise.allSettled(wave1)

  // ── Phase 2 : détails des interventions du technicien + lampadaires liés ──
  // (cœur du besoin hors ligne : pouvoir traiter ses interventions sans réseau)
  const woData = queryClient.getQueryData<any>(QK.workorders)
  const workOrders: any[] = woData?.work_orders ?? []
  const lampIds = new Set<number>()

  const wave2: Array<Promise<unknown>> = []
  for (const wo of workOrders.slice(0, 30)) {
    wave2.push(queryClient.prefetchQuery({
      queryKey: ['workorder', String(wo.id)],
      queryFn: () => getWorkOrder(wo.id),
    }))
    if (wo.lampadaire?.id) lampIds.add(wo.lampadaire.id)
  }
  // Détails + diagnostic des lampadaires concernés
  for (const id of lampIds) {
    wave2.push(queryClient.prefetchQuery({
      queryKey: ['lampadaire', String(id)],
      queryFn: () => getLampadaireDetails(id),
    }))
    wave2.push(queryClient.prefetchQuery({
      queryKey: ['diagnostic', String(id)],
      queryFn: () => getDiagnostic(id),
    }))
  }
  // Détails des LCUs (peu nombreuses)
  const lcuData = queryClient.getQueryData<any>(QK.lcus)
  for (const lcu of (lcuData?.lcus ?? []).slice(0, 20)) {
    wave2.push(queryClient.prefetchQuery({
      queryKey: ['lcu', String(lcu.id)],
      queryFn: () => getLCUDetails(lcu.id),
    }))
  }
  await Promise.allSettled(wave2)
}
