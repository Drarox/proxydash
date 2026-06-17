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
  <header class="mb-6 flex flex-col items-stretch gap-6 md:flex-row md:items-start md:justify-between">
    <div>
      <p class="mb-1 text-xs font-extrabold uppercase tracking-tight text-muted">ProxyDash</p>
      <h2 class="m-0 text-[clamp(1.7rem,4vw,2.5rem)] leading-tight">Domains and upstreams</h2>
      <span v-if="error" class="mt-3 inline-flex rounded-lg bg-red-soft px-2.5 py-1.5 text-sm font-extrabold text-red-brand">{{ error }}</span>
    </div>

    <div class="flex flex-col items-stretch gap-3 md:flex-row md:items-end">
      <a
        href="https://github.com/Drarox/proxydash"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line bg-surface font-extrabold text-text transition-all duration-200 hover:border-blue-brand hover:text-blue-brand md:w-11"
        title="GitHub Repository"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-6">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      </a>

      <label class="grid gap-1.5 text-xs font-extrabold uppercase tracking-tight text-muted">
        <span>Search</span>
        <input
          :value="query"
          type="search"
          placeholder="Domain, upstream, file..."
          class="min-h-11 w-full rounded-lg border border-line bg-surface px-4 text-text outline-none focus:border-blue-brand focus:ring-4 focus:ring-blue-soft md:w-xs"
          @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <button
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3.5 font-extrabold text-text transition-colors hover:border-blue-brand hover:text-blue-brand"
        type="button"
        @click="emit('toggle-theme')"
      >
        <span class="h-4 w-4 rounded-full bg-amber-brand shadow-toggle-sun dark:bg-blue-brand dark:shadow-toggle-moon"></span>
        {{ isDark ? 'Dark' : 'Light' }}
      </button>

      <button
        class="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-3.5 font-extrabold text-text transition-colors hover:border-blue-brand hover:text-blue-brand disabled:cursor-wait disabled:opacity-60"
        type="button"
        :disabled="isLoading"
        @click="emit('refresh')"
      >
        {{ isLoading ? 'Loading' : 'Refresh' }}
      </button>
    </div>
  </header>
</template>
