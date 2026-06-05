import { useEffect, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { runBootstrap } from '../lib/offline'

/**
 * Déclenche le bootstrap (téléchargement complet) au démarrage si en ligne,
 * et à chaque retour de connexion. Garantit que toutes les données sont
 * mises en cache pour un usage hors ligne ultérieur.
 */
export function useBootstrap() {
  const { isOnline } = useNetworkStatus()
  const wasOnline = useRef(false)

  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      wasOnline.current = true
      runBootstrap()
    }
    if (!isOnline) {
      wasOnline.current = false
    }
  }, [isOnline])
}
