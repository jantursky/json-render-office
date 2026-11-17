import type { Spec } from '@json-render/core'
import type { PropsIssue } from 'json-render-report'
import { ref, shallowRef } from 'vue'

import type { Format } from './download'
import { GenerateError, generateReport } from './generate'
import { exportReport, validateSpec } from './office'
import { hasContent } from './spec'

export type Phase = 'idle' | 'streaming' | 'done' | 'error'

const MESSAGES = {
  'no-model':
    'This deployment has no model configured, so it cannot write new reports. Choose one of the examples instead.',
  failed: 'The report could not be generated. Try again, or choose one of the examples.',
  export: 'The file could not be created. Try again.',
} as const

/** The report on screen, where it came from and what is happening to it. */
export function useReport() {
  const spec = shallowRef<Spec | null>(null)
  const phase = ref<Phase>('idle')
  const error = ref<string | null>(null)
  const issues = ref<PropsIssue[]>([])
  const exporting = ref<Format | null>(null)
  const exampleId = ref<string | null>(null)
  let controller: AbortController | null = null

  const settle = async (next: Spec): Promise<void> => {
    issues.value = await validateSpec(next)
    phase.value = 'done'
  }

  const start = (): AbortController => {
    controller?.abort()
    controller = new AbortController()
    error.value = null
    issues.value = []
    return controller
  }

  const showExample = async (id: string, example: Spec): Promise<void> => {
    start()
    exampleId.value = id
    spec.value = example
    await settle(example)
  }

  const generate = async (prompt: string): Promise<void> => {
    const { signal } = start()
    exampleId.value = null
    spec.value = null
    phase.value = 'streaming'
    try {
      await generateReport(prompt, signal, (next) => (spec.value = next))
      if (!hasContent(spec.value)) throw new GenerateError('failed')
      await settle(spec.value)
    } catch (caught) {
      if (signal.aborted) return
      phase.value = 'error'
      error.value = MESSAGES[caught instanceof GenerateError ? caught.kind : 'failed']
    }
  }

  const download = async (format: Format): Promise<void> => {
    if (!hasContent(spec.value) || exporting.value) return
    exporting.value = format
    error.value = null
    try {
      await exportReport(spec.value, format)
    } catch {
      error.value = MESSAGES.export
    } finally {
      exporting.value = null
    }
  }

  return { spec, phase, error, issues, exporting, exampleId, generate, showExample, download }
}
