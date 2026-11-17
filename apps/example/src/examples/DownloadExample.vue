<script setup lang="ts">
import { ref } from 'vue'

import { quarterly } from './quarterly'

const busy = ref<'pptx' | 'docx' | null>(null)

async function download(format: 'pptx' | 'docx'): Promise<void> {
  busy.value = format
  try {
    const { renderToDocxBlob, renderToPptxBlob } = await import('json-render-report')
    const blob = format === 'pptx' ? await renderToPptxBlob(quarterly) : await renderToDocxBlob(quarterly)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `quarterly-review.${format}`
    link.click()
    URL.revokeObjectURL(link.href)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="buttons">
    <button type="button" :disabled="busy !== null" @click="download('pptx')">
      {{ busy === 'pptx' ? 'Preparing…' : 'Download PPTX' }}
    </button>
    <button type="button" :disabled="busy !== null" @click="download('docx')">
      {{ busy === 'docx' ? 'Preparing…' : 'Download DOCX' }}
    </button>
  </div>
</template>

<style scoped>
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
button {
  min-height: 44px;
  padding: 12px 24px;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
