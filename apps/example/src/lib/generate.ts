import { createSpecStreamCompiler } from '@json-render/core'
import type { Spec } from '@json-render/core'

export const MAX_PROMPT_LENGTH = 500

export class GenerateError extends Error {
  constructor(readonly kind: 'no-model' | 'failed') {
    super(kind)
  }
}

/** Feeds a streamed JSONL patch body into the compiler and reports the spec after every chunk. */
export async function readSpecStream(
  body: ReadableStream<Uint8Array<ArrayBuffer>>,
  onSpec: (spec: Spec) => void,
): Promise<void> {
  const compiler = createSpecStreamCompiler<Spec>()
  const reader = body.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return
    const { result, newPatches } = compiler.push(value)
    if (newPatches.length > 0) onSpec(result)
  }
}

/** Asks the server for a report and streams the spec into `onSpec`. Rejects with a GenerateError. */
export async function generateReport(prompt: string, signal: AbortSignal, onSpec: (spec: Spec) => void): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new GenerateError('failed')
  }
  if (response.status === 501) throw new GenerateError('no-model')
  if (!response.ok || !response.body) throw new GenerateError('failed')
  await readSpecStream(response.body, onSpec).catch((error: unknown) => {
    if (signal.aborted) throw error
    throw new GenerateError('failed')
  })
}
