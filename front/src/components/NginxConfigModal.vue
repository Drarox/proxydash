<script setup lang="ts">
import type { NginxConfig } from '@/types/proxy'

defineProps<{
  config: NginxConfig | null
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="show && config" class="modal-backdrop" role="presentation" @click.self="emit('close')">
    <section class="config-modal" role="dialog" aria-modal="true" aria-labelledby="nginx-config-title">
      <header>
        <div>
          <p class="eyebrow">Global nginx configuration</p>
          <h2 id="nginx-config-title">{{ config.filename }}</h2>
          <span>{{ config.path }}</span>
        </div>

        <button class="icon-button" type="button" aria-label="Close config modal" @click="emit('close')">
          x
        </button>
      </header>

      <pre><code>{{ config.content }}</code></pre>
    </section>
  </div>
</template>
