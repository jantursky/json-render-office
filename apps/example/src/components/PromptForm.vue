<script setup lang="ts">
import { computed, ref } from 'vue'

import { MAX_PROMPT_LENGTH } from '../lib/generate'

const props = defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [prompt: string] }>()

const prompt = ref('')
const ready = computed(() => prompt.value.trim().length > 0 && !props.busy)

const submit = (): void => {
  if (ready.value) emit('submit', prompt.value.trim())
}
</script>

<template>
  <form class="prompt" @submit.prevent="submit">
    <label class="label" for="prompt">Describe the report</label>
    <textarea
      id="prompt"
      v-model="prompt"
      class="input"
      rows="4"
      :maxlength="MAX_PROMPT_LENGTH"
      placeholder="A quarterly review for the board: revenue, costs and next steps"
    />
    <div class="row">
      <span class="count">{{ prompt.length }} / {{ MAX_PROMPT_LENGTH }}</span>
      <button type="submit" class="button primary" :disabled="!ready">
        Generate report
        <span aria-hidden="true">→</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.prompt {
  display: grid;
  gap: 8px;
}
.label {
  font-weight: 500;
  color: var(--text-strong);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.count {
  font-size: 14px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
