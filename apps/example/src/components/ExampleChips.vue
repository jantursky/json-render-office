<script setup lang="ts">
import type { FixedExample } from '../examples'

defineProps<{ examples: FixedExample[]; activeId: string | null }>()
defineEmits<{ pick: [example: FixedExample] }>()
</script>

<template>
  <div class="chips" role="group" aria-labelledby="examples-label">
    <span id="examples-label" class="label">Or start from an example</span>
    <div class="list">
      <button
        v-for="example in examples"
        :key="example.id"
        type="button"
        class="button ghost chip"
        :aria-pressed="example.id === activeId"
        @click="$emit('pick', example)"
      >
        {{ example.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chips {
  display: grid;
  gap: 8px;
}
.label {
  font-size: 14px;
  color: var(--text-muted);
}
.list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 8px 16px;
}
.chip[aria-pressed='true'] {
  border-color: var(--text-strong);
  color: var(--text-strong);
}
</style>
