<script setup lang="ts">
import { createSpecStreamCompiler } from '@json-render/core'
import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/vue'
import { themeStyle, webRegistry, webStyles } from 'json-render-report/web'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { quarterly } from './quarterly'

const LINES_PER_TICK = 2
const TICK_MS = 250

// The patch lines a model would stream for the fixed spec, parents before children.
const lines: string[] = [JSON.stringify({ op: 'add', path: '/root', value: quarterly.root })]
const visit = (key: string): void => {
  const element = quarterly.elements[key]
  if (!element) return
  lines.push(JSON.stringify({ op: 'add', path: `/elements/${key}`, value: element }))
  element.children?.forEach(visit)
}
visit(quarterly.root)

// Vue templates reject a literal <style>, so the tag goes through a binding.
const styleTag = 'style'
const style = themeStyle()
const spec = shallowRef<Spec | null>(null)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const stop = (): void => {
  clearInterval(timer)
  playing.value = false
}

function replay(): void {
  stop()
  const compiler = createSpecStreamCompiler<Spec>()
  let next = 0
  spec.value = null
  playing.value = true
  timer = setInterval(() => {
    const chunk = lines.slice(next, next + LINES_PER_TICK).join('\n') + '\n'
    next += LINES_PER_TICK
    spec.value = compiler.push(chunk).result
    if (next >= lines.length) stop()
  }, TICK_MS)
}

onMounted(replay)
onBeforeUnmount(stop)
</script>

<template>
  <div class="stream">
    <button type="button" :disabled="playing" @click="replay">{{ playing ? 'Streaming…' : 'Replay' }}</button>
    <div class="frame" role="region" aria-label="Streaming report preview" tabindex="0">
      <component :is="styleTag">{{ webStyles }}</component>
      <JSONUIProvider v-if="spec" :registry="webRegistry">
        <div :style="style">
          <Renderer :spec="spec" :registry="webRegistry" />
        </div>
      </JSONUIProvider>
    </div>
  </div>
</template>

<style scoped>
.stream {
  display: grid;
  gap: 8px;
}
button {
  justify-self: start;
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
.frame {
  height: 420px;
  overflow: auto;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #ffffff;
}
</style>
