<script setup lang="ts">
import DownloadExample from './examples/DownloadExample.vue'
import PreviewExample from './examples/PreviewExample.vue'
import StreamingExample from './examples/StreamingExample.vue'
</script>

<template>
  <main class="page">
    <h1>Examples embedded in the docs</h1>
    <section>
      <h2>Preview</h2>
      <PreviewExample id="preview-example" />
    </section>
    <section>
      <h2>Download</h2>
      <DownloadExample />
    </section>
    <section>
      <h2>Streaming</h2>
      <StreamingExample />
    </section>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-4);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-4) var(--space-2);
}
h1,
h2 {
  margin: 0 0 var(--space-1);
  color: var(--text-strong);
  font-weight: 500;
}
h1 {
  font-size: 30px;
}
h2 {
  font-size: 20px;
}
</style>
