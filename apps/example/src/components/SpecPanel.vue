<script setup lang="ts">
import type { Spec } from '@json-render/core'
import { computed, ref } from 'vue'

const props = defineProps<{ spec: Spec | null }>()

const open = ref(false)
const copied = ref(false)
// Stringifying on every streamed chunk is wasted work while the panel is closed.
const json = computed(() => (open.value && props.spec ? JSON.stringify(props.spec, null, 2) : ''))

const copy = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.spec, null, 2))
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <details class="spec" @toggle="open = ($event.target as HTMLDetailsElement).open">
    <summary>Spec (JSON)</summary>
    <div class="body">
      <div class="toolbar">
        <span class="hint">The model writes this; every output format is built from it.</span>
        <button type="button" class="button ghost" :disabled="!spec" @click="copy">
          {{ copied ? 'Copied' : 'Copy JSON' }}
        </button>
      </div>
      <pre v-if="spec" class="code" tabindex="0" aria-label="Report spec as JSON"><code>{{ json }}</code></pre>
      <p v-else class="hint">No spec yet.</p>
    </div>
  </details>
</template>

<style scoped>
.spec {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}
summary {
  padding: var(--space-2) var(--space-3);
  font-weight: 500;
  color: var(--text-strong);
  cursor: pointer;
  border-radius: var(--radius);
}
.body {
  display: grid;
  gap: var(--space-2);
  padding: 0 var(--space-3) var(--space-3);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-1);
}
.hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}
.code {
  max-height: 360px;
  margin: 0;
  padding: var(--space-2);
  overflow: auto;
  border-radius: var(--radius);
  background: var(--carbon);
  color: #e5e7eb;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
}
</style>
