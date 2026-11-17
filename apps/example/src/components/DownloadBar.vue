<script setup lang="ts">
import type { Format } from '../lib/download'

defineProps<{ disabled: boolean; exporting: Format | null }>()
defineEmits<{ download: [format: Format] }>()
</script>

<template>
  <div class="downloads" role="group" aria-label="Download the report">
    <button type="button" class="button ghost" :disabled="disabled" @click="$emit('download', 'pptx')">
      {{ exporting === 'pptx' ? 'Preparing…' : 'Download PPTX' }}
    </button>
    <button type="button" class="button ghost" :disabled="disabled" @click="$emit('download', 'docx')">
      {{ exporting === 'docx' ? 'Preparing…' : 'Download DOCX' }}
    </button>
  </div>
</template>

<style scoped>
.downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
