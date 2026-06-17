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
  <section class="mb-4 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center" aria-label="Route filters">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="min-h-9 rounded-full border border-line bg-surface px-3.5 font-extrabold text-muted transition-colors"
        :class="{ '!border-blue-brand !bg-blue-soft !text-blue-brand': activeFilter === filter.value }"
        @click="emit('update:activeFilter', filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="whitespace-nowrap font-extrabold text-muted max-md:whitespace-normal">{{ resultCount }} of {{ totalCount }} sites</div>
  </section>
</template>
