<script setup lang="ts">
import type { ProxySite } from '@/types/proxy'

defineProps<{
  site: ProxySite | null
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="site" class="fixed inset-0 z-20 grid place-items-center bg-slate-900/60 p-6" role="presentation" @click.self="emit('close')">
    <section class="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-line bg-surface text-text shadow-modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <header class="flex items-start justify-between gap-4 border-b border-line px-5 py-4.5">
        <div>
          <p class="mb-1 text-xs font-extrabold uppercase tracking-tight text-muted">Full config file</p>
          <h2 id="config-title" class="m-0 leading-tight">{{ site.domain }}</h2>
          <span class="mt-1.5 block overflow-anywhere text-sm text-muted">{{ site.configPath }}</span>
        </div>

        <button class="grid h-9 w-9 flex-none place-items-center rounded-lg border border-line bg-surface font-extrabold text-text transition-colors hover:border-blue-brand hover:text-blue-brand" type="button" aria-label="Close config modal" @click="emit('close')">
          x
        </button>
      </header>

      <pre class="m-0 max-h-full overflow-auto bg-code-bg p-5 text-sm leading-relaxed text-code-text"><code class="border-0 bg-transparent p-0 text-inherit">{{ site.config }}</code></pre>
    </section>
  </div>
</template>
