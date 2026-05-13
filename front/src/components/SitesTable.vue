<script setup lang="ts">
import type { ProxySite } from '@/types/proxy'

defineProps<{
  isLoading: boolean
  sites: ProxySite[]
}>()

const emit = defineEmits<{
  'open-config': [site: ProxySite]
}>()

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
  <section class="sites-section" aria-label="Configured sites">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Upstream</th>
            <th>Certificate</th>
            <th>Options</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="site in sites" :key="site.id">
            <td>
              <div class="domain-cell">
                <a
                  :href="`https://${site.domain}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="domain-link"
                >
                  <span class="domain-name">{{ site.domain }}</span>
                  <span class="external-icon" aria-hidden="true">↗</span>
                </a>
                <span class="muted">{{ site.aliases.length ? site.aliases.join(', ') : site.configPath }}</span>
              </div>
            </td>
            <td>
              <div class="upstream-cell">
                <div class="upstream-address">
                  <code>{{ site.upstream }}</code>
                  <span v-if="site.upstreamName" class="muted">from upstream {{ site.upstreamName }}</span>
                  <span v-else class="muted">{{ site.proxyPass }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="certificate-cell">
                <span class="cert-pill" :data-status="site.certificateStatus">
                  {{ site.certificateStatus }}
                </span>
                <span class="muted">{{ certificateLabel(site) }}</span>
              </div>
            </td>
            <td>
              <div v-if="hasConfiguredOptions(site)" class="options-grid">
                <span v-if="site.options.gzip !== null" :data-enabled="site.options.gzip">
                  Gzip {{ optionLabel(site.options.gzip) }}
                </span>
                <span v-if="site.options.basicAuth !== null" :data-enabled="site.options.basicAuth">
                  Auth {{ optionLabel(site.options.basicAuth) }}
                </span>
                <span v-if="site.options.websocket !== null" :data-enabled="site.options.websocket">
                  WS {{ optionLabel(site.options.websocket) }}
                </span>
                <span v-if="site.options.proxyBuffering !== null" :data-enabled="site.options.proxyBuffering">
                  Buffer {{ optionLabel(site.options.proxyBuffering) }}
                </span>
                <span v-if="site.options.maxClientBodySize !== null" data-enabled="true">
                  Body {{ site.options.maxClientBodySize }}
                </span>
              </div>
              <span v-else class="muted">No explicit options</span>
            </td>
            <td class="actions-cell">
              <button class="view-button" type="button" @click="emit('open-config', site)">Config</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="isLoading" class="empty-state">
        <strong>Loading sites</strong>
        <span>Fetching Nginx site data from the backend.</span>
      </div>

      <div v-else-if="sites.length === 0" class="empty-state">
        <strong>No routes found</strong>
        <span>Adjust the search or filter selection.</span>
      </div>
    </div>
  </section>
</template>
