<script setup lang="ts">
import type { FilterKey } from '@/types/proxy'

defineProps<{
  activeFilter: FilterKey
  filters: Array<{ label: string; value: FilterKey }>
  resultCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  'update:activeFilter': [value: FilterKey]
}>()
</script>

<template>
  <section class="toolbar" aria-label="Route filters">
    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        :class="{ active: activeFilter === filter.value }"
        @click="emit('update:activeFilter', filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="result-count">{{ resultCount }} of {{ totalCount }} sites</div>
  </section>
</template>
