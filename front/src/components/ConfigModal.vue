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
  <div v-if="site" class="modal-backdrop" role="presentation" @click.self="emit('close')">
    <section class="config-modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <header>
        <div>
          <p class="eyebrow">Full config file</p>
          <h2 id="config-title">{{ site.domain }}</h2>
          <span>{{ site.configPath }}</span>
        </div>

        <button class="icon-button" type="button" aria-label="Close config modal" @click="emit('close')">
          x
        </button>
      </header>

      <pre><code>{{ site.config }}</code></pre>
    </section>
  </div>
</template>
