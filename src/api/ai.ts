import { apiClient } from './client'

export interface AIDiagnostic {
  priority: 'critical' | 'high' | 'medium' | 'low'
  probable_cause: string
  confidence: number
  impact: Record<string, unknown>
  checklist: string[]
  tools_required: string[]
  expected_result: string
  recommendations: AIDiagnosticRecommendation[]
  risk_score: number | null
  generated_at: string
  workorder?: {
    id: number
    title: string
    status: string
    priority: string
  }
}

export interface AIDiagnosticRecommendation {
  id: string
  title: string
  reason: string
  action: string
  priority: string
  category: string
  confidence: number
  entity_reference?: string
}

export interface AIMissions {
  missions: AIMission[]
  total: number
  generated_at: string
}

export interface AIMission {
  id: string
  title: string
  priority: string
  category: string
  reason: string
  action: string
  entity_type: string
  entity_id: number | null
  entity_reference: string | null
  confidence: number
}

export const getAILampadaireDiagnostic = (id: string | number): Promise<AIDiagnostic> =>
  apiClient.get(`/mobile/ai/lampadaires/${id}/diagnostic`)

export const getAILCUDiagnostic = (id: string | number): Promise<AIDiagnostic> =>
  apiClient.get(`/mobile/ai/lcus/${id}/diagnostic`)

export const getAIWorkOrderDiagnostic = (id: string | number): Promise<AIDiagnostic> =>
  apiClient.get(`/mobile/ai/workorders/${id}/diagnostic`)

export const getAIMissions = (): Promise<AIMissions> =>
  apiClient.get('/mobile/ai/missions')
