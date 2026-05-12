import type { ProxySite } from '@/types/proxy'

const SITES_ENDPOINT = 'http://localhost:3000/api/nginx/sites'

export async function fetchSites(): Promise<ProxySite[]> {
  const response = await fetch(SITES_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to load sites: ${response.status}`)
  }

  return (await response.json()) as ProxySite[]
}
