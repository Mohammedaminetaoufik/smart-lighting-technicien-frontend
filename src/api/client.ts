import axios from 'axios'
import { API_URL, DEFAULT_TECHNICIAN_ID } from '../constants/config'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Injecte automatiquement le technician_id dans chaque requête GET
// TODO(auth): Quand AUTH_ENABLED=true, remplacer par un intercepteur JWT Bearer token.
apiClient.interceptors.request.use((config) => {
  if (config.method === 'get' && config.params) {
    config.params.technician_id = config.params.technician_id ?? DEFAULT_TECHNICIAN_ID
  } else if (config.method === 'get') {
    config.params = { technician_id: DEFAULT_TECHNICIAN_ID }
  }
  return config
})
