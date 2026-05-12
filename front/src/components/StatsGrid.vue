<script setup lang="ts">
import type { DashboardStat } from '@/types/proxy'

defineProps<{
  stats: DashboardStat[]
}>()
</script>

<template>
  <section class="stats-grid" aria-label="Proxy statistics">
    <article v-for="stat in stats" :key="stat.label" class="stat-card" :data-tone="stat.tone">
      <p>{{ stat.label }}</p>
      <strong>{{ stat.value }}</strong>
      <span>{{ stat.detail }}</span>
    </article>
  </section>
</template>
