import type { NginxConfig, ProxySite } from '@/types/proxy'

const SITES_ENDPOINT = 'http://localhost:3000/api/nginx/sites'
const CONFIG_ENDPOINT = 'http://localhost:3000/api/nginx/config'

export async function fetchSites(): Promise<ProxySite[]> {
  const response = await fetch(SITES_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to load sites: ${response.status}`)
  }

  return (await response.json()) as ProxySite[]
}

export async function fetchNginxConfig(): Promise<NginxConfig> {
  const response = await fetch(CONFIG_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to load nginx config: ${response.status}`)
  }

  return (await response.json()) as NginxConfig
}
