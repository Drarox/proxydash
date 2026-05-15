import type { NginxConfig, ProxySite } from '@/types/proxy'

const SITES_ENDPOINT = '/api/nginx/sites'
const CONFIG_ENDPOINT = '/api/nginx/config'
const CERT_CACHE_REFRESH_ENDPOINT = '/api/nginx/cert-cache/refresh'

export async function fetchSites(): Promise<ProxySite[]> {
  const response = await fetch(SITES_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to load sites: ${response.status}`)
  }

  return (await response.json()) as ProxySite[]
}

export async function refreshCertCache(): Promise<void> {
  const response = await fetch(CERT_CACHE_REFRESH_ENDPOINT, { method: 'POST' })

  if (!response.ok) {
    throw new Error(`Failed to refresh cert cache: ${response.status}`)
  }
}

export async function fetchNginxConfig(): Promise<NginxConfig> {
  const response = await fetch(CONFIG_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to load nginx config: ${response.status}`)
  }

  return (await response.json()) as NginxConfig
}
