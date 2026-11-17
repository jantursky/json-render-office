<script setup lang="ts">
import { computed } from 'vue'

import DownloadBar from './components/DownloadBar.vue'
import ExampleChips from './components/ExampleChips.vue'
import PromptForm from './components/PromptForm.vue'
import ReportPreview from './components/ReportPreview.vue'
import SiteHeader from './components/SiteHeader.vue'
import SpecPanel from './components/SpecPanel.vue'
import { fixedExamples } from './examples'
import { hasContent } from './lib/spec'
import { useReport } from './lib/useReport'
import { useTheme } from './lib/theme'

const { theme, toggle } = useTheme()
const { spec, phase, error, issues, exporting, exampleId, generate, showExample, download } = useReport()

const streaming = computed(() => phase.value === 'streaming')
const canDownload = computed(() => hasContent(spec.value) && !streaming.value && exporting.value === null)
const status = computed(() => {
  if (error.value) return error.value
  if (streaming.value) return 'Writing the report…'
  if (phase.value === 'done') return 'The report is ready. Download it as a deck or a document.'
  return 'Write a prompt, or start from an example. Examples work without a model.'
})
</script>

<template>
  <SiteHeader :theme="theme" @toggle="toggle" />
  <main class="page">
    <div class="card hero">
      <div class="copy">
        <span class="badge">json-render-report</span>
        <h1>One spec, three formats</h1>
        <p class="lede">
          Describe a report. A model writes it as a json-render spec, the page on the right updates while it streams,
          and the same spec downloads as an editable PowerPoint deck or Word document.
        </p>
        <PromptForm :busy="streaming" @submit="generate" />
        <ExampleChips :examples="fixedExamples" :active-id="exampleId" @pick="(e) => showExample(e.id, e.spec)" />
        <p class="status" :class="{ failed: error }" :role="error ? 'alert' : 'status'">{{ status }}</p>
        <DownloadBar :disabled="!canDownload" :exporting="exporting" @download="download" />
        <section v-if="issues.length > 0" class="issues" aria-labelledby="issues-title">
          <h2 id="issues-title">The spec has {{ issues.length }} issue{{ issues.length === 1 ? '' : 's' }}</h2>
          <p>The report is still shown. Downloads skip or clip what does not fit.</p>
          <ul>
            <li v-for="issue in issues" :key="issue.element">
              <strong>{{ issue.type }}</strong> <code>{{ issue.element }}</code>
              <span>{{ issue.message }}</span>
            </li>
          </ul>
        </section>
      </div>
      <ReportPreview :spec="spec" :busy="streaming" />
    </div>
    <SpecPanel :spec="spec" />
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-4);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-4) var(--space-2) var(--space-8);
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 9fr) minmax(0, 11fr);
  gap: var(--space-5);
  align-items: start;
}
.copy {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}
.badge {
  justify-self: start;
}
h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--text-strong);
}
.lede {
  margin: 0;
  font-size: 18px;
  color: var(--text-muted);
}
.status {
  min-height: 3em;
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}
.status.failed {
  color: var(--text-strong);
}
.issues {
  padding: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  color: var(--text);
}
.issues h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-strong);
}
.issues p {
  margin: 0 0 var(--space-1);
}
.issues ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.issues li span {
  display: block;
  max-height: 4.5em;
  overflow: auto;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: pre-wrap;
}
@media (max-width: 900px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }
}
@media (max-width: 480px) {
  .hero {
    padding: var(--space-3) var(--space-2);
  }
}
</style>
