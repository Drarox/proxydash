<script setup lang="ts">
import { ref } from 'vue'
import ConfigModal from '@/components/ConfigModal.vue'
import DashboardHeader from '@/components/DashboardHeader.vue'
import FilterToolbar from '@/components/FilterToolbar.vue'
import NginxConfigModal from '@/components/NginxConfigModal.vue'
import SitesTable from '@/components/SitesTable.vue'
import StatsGrid from '@/components/StatsGrid.vue'
import { filters, useProxySites } from '@/composables/useProxySites'

const isDark = ref(localStorage.getItem('theme') === 'dark')

const {
  activeFilter,
  closeConfig,
  closeNginxConfig,
  error,
  filteredSites,
  isLoading,
  loadSites,
  nginxConfig,
  openConfig,
  query,
  selectedSite,
  showNginxConfig,
  sites,
  stats,
} = useProxySites()

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <div class="app-shell" :class="{ 'theme-dark': isDark }">
    <div class="dashboard">
      <main class="main-content">
        <DashboardHeader
          v-model:query="query"
          :error="error"
          :is-dark="isDark"
          :is-loading="isLoading"
          @refresh="loadSites"
          @toggle-theme="toggleTheme"
        />

        <StatsGrid :stats="stats" />

        <FilterToolbar
          v-model:active-filter="activeFilter"
          :filters="filters"
          :result-count="filteredSites.length"
          :total-count="sites.length"
        />

        <SitesTable :is-loading="isLoading" :sites="filteredSites" @open-config="openConfig" />
      </main>
    </div>

    <ConfigModal :site="selectedSite" @close="closeConfig" />
    <NginxConfigModal :config="nginxConfig" :show="showNginxConfig" @close="closeNginxConfig" />
  </div>
</template>
