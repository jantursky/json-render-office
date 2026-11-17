<script setup lang="ts">
import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/vue'
import { themeStyle, webRegistry, webStyles } from 'json-render-report/web'

defineProps<{ spec: Spec | null; busy: boolean }>()

// Vue templates reject a literal <style>, so the tag goes through a binding.
const styleTag = 'style'
const style = themeStyle()
</script>

<template>
  <section class="preview" :aria-busy="busy">
    <h2 class="title">Web preview</h2>
    <div class="frame" tabindex="0" role="region" aria-label="Report preview, scrollable">
      <component :is="styleTag">{{ webStyles }}</component>
      <JSONUIProvider v-if="spec" :registry="webRegistry">
        <div :style="style">
          <Renderer :spec="spec" :registry="webRegistry" />
        </div>
      </JSONUIProvider>
      <p v-else class="empty">The report appears here while it is being written.</p>
    </div>
  </section>
</template>

<style scoped>
.preview {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  min-width: 0;
}
.title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}
.frame {
  height: 560px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #ffffff;
}
.empty {
  display: grid;
  place-items: center;
  height: 100%;
  margin: 0;
  padding: var(--space-3);
  text-align: center;
  color: #4a5565;
}
</style>
