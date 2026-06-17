<script setup lang="ts">
import { ref } from 'vue'
import type { ProxySite } from '@/types/proxy'
import { refreshCertCache } from '@/services/sitesApi'

defineProps<{
  isLoading: boolean
  sites: ProxySite[]
}>()

const emit = defineEmits<{
  'open-config': [site: ProxySite]
  'refresh-sites': []
}>()

const isRefreshingCert = ref(false)

async function handleCertRefresh() {
  if (isRefreshingCert.value) return
  isRefreshingCert.value = true
  try {
    await refreshCertCache()
    emit('refresh-sites')
  } finally {
    isRefreshingCert.value = false
  }
}

function certificateLabel(site: ProxySite) {
  if (site.certificateStatus === 'missing') {
    return 'No certificate'
  }

  if (!site.certificateExpiresAt) {
    return site.certificatePath ?? 'No expiry date'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(site.certificateExpiresAt))
}

function optionLabel(enabled: boolean) {
  return enabled ? 'On' : 'Off'
}

function hasConfiguredOptions(site: ProxySite) {
  return Object.values(site.options).some((value) => value !== null)
}
</script>

<template>
  <section aria-label="Configured sites">
    <div class="overflow-auto rounded-lg border border-line bg-surface shadow-custom">
      <table class="w-full min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th class="border-b border-line bg-surface-soft p-4 text-left text-xs font-extrabold uppercase tracking-tight text-muted">Domain</th>
            <th class="border-b border-line bg-surface-soft p-4 text-left text-xs font-extrabold uppercase tracking-tight text-muted">Upstream</th>
            <th class="border-b border-line bg-surface-soft p-4 text-left text-xs font-extrabold uppercase tracking-tight text-muted">Certificate</th>
            <th class="border-b border-line bg-surface-soft p-4 text-left text-xs font-extrabold uppercase tracking-tight text-muted">Options</th>
            <th class="border-b border-line bg-surface-soft p-4 text-left text-xs font-extrabold uppercase tracking-tight text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="site in sites" 
            :key="site.id" 
            class="hover:bg-table-row-hover last:[&_td]:border-b-0"
          >
            <td class="border-b border-line p-4 align-middle">
              <div class="grid gap-1.5">
                <a
                  :href="`https://${site.domain}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group inline-flex items-center gap-1 text-inherit no-underline"
                >
                  <span class="font-semibold">{{ site.domain }}</span>
                  <span class="text-xs opacity-70 transition-all duration-150 group-hover:scale-110 group-hover:opacity-100" aria-hidden="true">↗</span>
                </a>
                <span class="text-sm text-muted">{{ site.aliases.length ? site.aliases.join(', ') : site.configPath }}</span>
              </div>
            </td>
            <td class="border-b border-line p-4 align-middle">
              <div>
                <div class="grid gap-1.5">
                  <code class="w-max rounded-md border border-line bg-surface-soft px-2 py-1 text-sm text-text">{{ site.upstream }}</code>
                  <span v-if="site.upstreamName" class="text-sm text-muted">from upstream {{ site.upstreamName }}</span>
                  <span v-else class="text-sm text-muted">{{ site.proxyPass }}</span>
                </div>
              </div>
            </td>
            <td class="border-b border-line p-4 align-middle">
              <div class="flex flex-wrap items-center gap-1.5">
                <span 
                  class="inline-flex min-h-6.5 items-center justify-center rounded-full px-2.5 text-xs font-black capitalize"
                  :class="{
                    'bg-green-soft text-green-brand': site.certificateStatus === 'valid',
                    'bg-amber-soft text-amber-brand': site.certificateStatus === 'warning',
                    'bg-red-soft text-red-brand': site.certificateStatus === 'expired' || site.certificateStatus === 'missing',
                    'bg-surface-strong text-muted': site.certificateStatus === 'unknown'
                  }"
                >
                  {{ site.certificateStatus }}
                </span>
                <button
                  v-if="site.certificateStatus === 'unknown'"
                  class="inline-flex items-center justify-center rounded border-none bg-none p-1 opacity-60 transition-all duration-150 hover:bg-cert-refresh-hover hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  :disabled="isRefreshingCert"
                  :aria-label="`Refresh certificate status for ${site.domain}`"
                  :title="isRefreshingCert ? 'Refreshing…' : 'Refresh certificate status'"
                  @click="handleCertRefresh"
                >
                  <svg
                    class="h-3.5 w-3.5"
                    :class="{ 'animate-spin': isRefreshingCert }"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
                <span class="text-sm text-muted">{{ certificateLabel(site) }}</span>
              </div>
            </td>
            <td class="border-b border-line p-4 align-middle">
              <div v-if="hasConfiguredOptions(site)" class="flex max-w-80 flex-wrap gap-1.5">
                <span 
                  v-if="site.options.gzip !== null" 
                  class="min-h-7 rounded-md border border-line px-2 py-1.5 text-xs font-extrabold"
                  :class="site.options.gzip ? 'border-green-line text-green-brand' : 'text-muted'"
                >
                  Gzip {{ optionLabel(site.options.gzip) }}
                </span>
                <span 
                  v-if="site.options.basicAuth !== null" 
                  class="min-h-7 rounded-md border border-line px-2 py-1.5 text-xs font-extrabold"
                  :class="site.options.basicAuth ? 'border-green-line text-green-brand' : 'text-muted'"
                >
                  Auth {{ optionLabel(site.options.basicAuth) }}
                </span>
                <span 
                  v-if="site.options.websocket !== null" 
                  class="min-h-7 rounded-md border border-line px-2 py-1.5 text-xs font-extrabold"
                  :class="site.options.websocket ? 'border-green-line text-green-brand' : 'text-muted'"
                >
                  WS {{ optionLabel(site.options.websocket) }}
                </span>
                <span 
                  v-if="site.options.proxyBuffering !== null" 
                  class="min-h-7 rounded-md border border-line px-2 py-1.5 text-xs font-extrabold"
                  :class="site.options.proxyBuffering ? 'border-green-line text-green-brand' : 'text-muted'"
                >
                  Buffer {{ optionLabel(site.options.proxyBuffering) }}
                </span>
                <span 
                  v-if="site.options.maxClientBodySize !== null" 
                  class="min-h-7 rounded-md border border-green-line px-2 py-1.5 text-xs font-extrabold text-green-brand"
                >
                  Body {{ site.options.maxClientBodySize }}
                </span>
              </div>
              <span v-else class="text-sm text-muted">No explicit options</span>
            </td>
            <td class="border-b border-line p-4 text-right align-middle">
              <button class="min-h-9 rounded-lg border border-line bg-surface px-3.5 font-extrabold text-text transition-colors hover:border-blue-brand hover:text-blue-brand" type="button" @click="emit('open-config', site)">Config</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="isLoading" class="grid min-h-[180px] place-items-center gap-1.5 text-muted">
        <strong class="text-text">Loading sites</strong>
        <span>Fetching Nginx site data from the backend.</span>
      </div>

      <div v-else-if="sites.length === 0" class="grid min-h-[180px] place-items-center gap-1.5 text-muted">
        <strong class="text-text">No routes found</strong>
        <span>Adjust the search or filter selection.</span>
      </div>
    </div>
  </section>
</template>