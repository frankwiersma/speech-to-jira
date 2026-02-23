const LS = 'stj_'

export interface ApiKeys {
  deepgramKey: string
  azureKey: string
  azureEndpoint: string
  azureDeployment: string
}

const DEFAULTS: ApiKeys = {
  deepgramKey: '',
  azureKey: '',
  azureEndpoint: '',
  azureDeployment: 'gpt-4o',
}

export function getKeys(): ApiKeys {
  if (typeof window === 'undefined') return DEFAULTS
  return {
    deepgramKey: localStorage.getItem(LS + 'deepgramKey') ?? '',
    azureKey: localStorage.getItem(LS + 'azureKey') ?? '',
    azureEndpoint: localStorage.getItem(LS + 'azureEndpoint') ?? '',
    azureDeployment: localStorage.getItem(LS + 'azureDeployment') ?? 'gpt-4o',
  }
}

export function saveKeys(keys: ApiKeys): void {
  if (typeof window === 'undefined') return
  for (const [k, v] of Object.entries(keys)) {
    if (v.trim()) localStorage.setItem(LS + k, v.trim())
    else localStorage.removeItem(LS + k)
  }
}

export function hasRequiredKeys(): boolean {
  const { deepgramKey, azureKey, azureEndpoint } = getKeys()
  return !!(deepgramKey && azureKey && azureEndpoint)
}

/** Returns fetch headers to include API keys */
export function getApiHeaders(): Record<string, string> {
  const { deepgramKey, azureKey, azureEndpoint, azureDeployment } = getKeys()
  const headers: Record<string, string> = {}
  if (deepgramKey) headers['x-deepgram-key'] = deepgramKey
  if (azureKey) headers['x-azure-key'] = azureKey
  if (azureEndpoint) headers['x-azure-endpoint'] = azureEndpoint
  if (azureDeployment) headers['x-azure-deployment'] = azureDeployment
  return headers
}
