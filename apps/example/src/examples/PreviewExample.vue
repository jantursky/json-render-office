<script setup lang="ts">
import { JSONUIProvider, Renderer } from '@json-render/vue'
import { themeStyle, webRegistry, webStyles } from 'json-render-report/web'

import { quarterly } from './quarterly'

// Vue templates reject a literal <style>, so the tag goes through a binding.
const styleTag = 'style'
const style = themeStyle()
</script>

<template>
  <div class="frame" role="region" aria-label="Report preview" tabindex="0">
    <component :is="styleTag">{{ webStyles }}</component>
    <JSONUIProvider :registry="webRegistry">
      <div :style="style">
        <Renderer :spec="quarterly" :registry="webRegistry" />
      </div>
    </JSONUIProvider>
  </div>
</template>

<style scoped>
.frame {
  max-height: 420px;
  overflow: auto;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  background: #ffffff;
}
</style>
