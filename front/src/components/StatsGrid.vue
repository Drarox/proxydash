<script setup lang="ts">
import type { DashboardStat } from '@/types/proxy'

defineProps<{
  stats: DashboardStat[]
}>()
</script>

<template>
  <section class="mb-4 grid grid-cols-4 gap-4 lg:grid-cols-4 md:grid-cols-2 max-md:grid-cols-1" aria-label="Proxy statistics">
    <article 
      v-for="stat in stats" 
      :key="stat.label" 
      class="min-h-36 rounded-lg border border-line bg-surface p-4.5 shadow-custom max-md:min-h-30" 
      :class="{ 
        'cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0': stat.action,
        'border-t-4 border-t-blue-brand': stat.tone === 'blue',
        'border-t-4 border-t-green-brand': stat.tone === 'green',
        'border-t-4 border-t-amber-brand': stat.tone === 'amber',
        'border-t-4 border-t-violet-brand': stat.tone === 'violet'
      }"
      @click="stat.action?.()"
    >
      <p class="m-0 font-bold text-muted">{{ stat.label }}</p>
      <strong class="mt-4 mb-1.5 block text-4xl font-bold leading-none text-text">{{ stat.value }}</strong>
      <span class="m-0 font-bold text-muted">{{ stat.detail }}</span>
    </article>
  </section>
</template>
