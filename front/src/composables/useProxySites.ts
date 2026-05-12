import { computed, onMounted, ref } from 'vue'
import { fetchSites } from '@/services/sitesApi'
import type { DashboardStat, FilterKey, ProxySite } from '@/types/proxy'

export const filters: Array<{ label: string; value: FilterKey }> = [
  { label: 'All', value: 'all' },
  { label: 'Valid TLS', value: 'valid' },
  { label: 'TLS warning', value: 'warning' },
  { label: 'Expired', value: 'expired' },
  { label: 'Missing cert', value: 'missing' },
  { label: 'Unknown', value: 'unknown' },
]

export function useProxySites() {
  const sites = ref<ProxySite[]>([])
  const query = ref('')
  const activeFilter = ref<FilterKey>('all')
  const selectedSite = ref<ProxySite | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  const filteredSites = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()

    return sites.value.filter((site) => {
      const matchesQuery =
        !normalizedQuery ||
        site.domain.toLowerCase().includes(normalizedQuery) ||
        site.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery)) ||
        site.upstream.toLowerCase().includes(normalizedQuery) ||
        site.configPath.toLowerCase().includes(normalizedQuery)

      const matchesFilter = activeFilter.value === 'all' || site.certificateStatus === activeFilter.value

      return matchesQuery && matchesFilter
    })
  })

  const stats = computed<DashboardStat[]>(() => {
    const total = sites.value.length
    const secured = sites.value.filter((site) => site.certificateStatus === 'valid').length
    const attention = sites.value.filter((site) => site.certificateStatus !== 'valid').length
    const upstreamBlocks = sites.value.filter((site) => site.upstreamName).length
    const tlsHealth = total === 0 ? 0 : Math.round((secured / total) * 100)

    return [
      { label: 'Sites', value: total.toString(), detail: 'Loaded from backend', tone: 'blue' },
      { label: 'Attention', value: attention.toString(), detail: 'Certificate issues', tone: 'amber' },
      { label: 'TLS healthy', value: `${tlsHealth}%`, detail: `${secured} valid certs`, tone: 'green' },
      { label: 'Upstreams', value: upstreamBlocks.toString(), detail: 'Named upstream blocks', tone: 'violet' },
    ]
  })

  async function loadSites() {
    isLoading.value = true
    error.value = null

    try {
      sites.value = await fetchSites()
    } catch (loadError) {
      sites.value = []
      error.value = loadError instanceof Error ? loadError.message : 'Failed to load sites'
    } finally {
      isLoading.value = false
    }
  }

  function openConfig(site: ProxySite) {
    selectedSite.value = site
  }

  function closeConfig() {
    selectedSite.value = null
  }

  onMounted(loadSites)

  return {
    activeFilter,
    closeConfig,
    error,
    filteredSites,
    isLoading,
    loadSites,
    openConfig,
    query,
    selectedSite,
    sites,
    stats,
  }
}
