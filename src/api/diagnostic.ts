import { apiClient } from './client'

export const getDiagnostic = async (lampadaireId: number) => {
  const { data } = await apiClient.get(`/api/mobile/lampadaires/${lampadaireId}/diagnostic`)
  return data
}

export const getLatestTelemetry = async (lampadaireId: number) => {
  const { data } = await apiClient.get(`/api/mobile/lampadaires/${lampadaireId}/telemetry/latest`)
  return data
}
