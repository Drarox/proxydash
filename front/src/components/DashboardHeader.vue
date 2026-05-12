<script setup lang="ts">
defineProps<{
  error: string | null
  isDark: boolean
  isLoading: boolean
  query: string
}>()

const emit = defineEmits<{
  refresh: []
  'toggle-theme': []
  'update:query': [value: string]
}>()
</script>

<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">ProxyDash</p>
      <h2>Domains and upstreams</h2>
      <span v-if="error" class="topbar-error">{{ error }}</span>
    </div>

    <div class="topbar-actions">
      <label class="search-control">
        <span>Search</span>
        <input
          :value="query"
          type="search"
          placeholder="Domain, upstream, file..."
          @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button class="theme-toggle" type="button" @click="emit('toggle-theme')">
        <span class="toggle-orb"></span>
        {{ isDark ? 'Dark' : 'Light' }}
      </button>

      <button class="refresh-button" type="button" :disabled="isLoading" @click="emit('refresh')">
        {{ isLoading ? 'Loading' : 'Refresh' }}
      </button>
    </div>
  </header>
</template>
