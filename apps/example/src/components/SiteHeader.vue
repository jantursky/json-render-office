<script setup lang="ts">
import type { Theme } from '../lib/theme'
import LogoMark from './LogoMark.vue'

defineProps<{ theme: Theme }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <header class="site-header">
    <div class="bar">
      <a class="brand" href="/" aria-label="Report generator, home">
        <LogoMark />
        <span>Report generator</span>
      </a>
      <button type="button" class="button ghost" @click="$emit('toggle')">
        {{ theme === 'dark' ? 'Light theme' : 'Dark theme' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  max-width: var(--content-width);
  height: 64px;
  margin: 0 auto;
  padding: 0 var(--space-2);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text-strong);
  font-weight: 500;
  text-decoration: none;
}
</style>
