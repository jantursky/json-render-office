import { createSpecStreamCompiler, type Spec } from '@json-render/core'
import { describe, expect, it } from 'vitest'

import { renderToDocx, renderToPptx } from '../src'
import { reportSpec, unzip } from './helpers'

/** The spec as the model streams it: one JSON Patch line per element, root first. */
const patchLines = (spec: Spec): string[] => [
  JSON.stringify({ op: 'add', path: '/root', value: spec.root }),
  ...Object.entries(spec.elements).map(([key, value]) =>
    JSON.stringify({ op: 'add', path: `/elements/${key}`, value }),
  ),
]

const chunks = (text: string, size: number): string[] =>
  Array.from({ length: Math.ceil(text.length / size) }, (_, i) => text.slice(i * size, (i + 1) * size))

describe('streamed report', () => {
  it('renders every intermediate state, cut at arbitrary characters', async () => {
    const compiler = createSpecStreamCompiler<Spec>()
    const text = patchLines(reportSpec()).join('\n') + '\n'
    let renders = 0
    for (const chunk of chunks(text, 37)) {
      const { result } = compiler.push(chunk)
      await expect(renderToPptx(result, { onWarn: () => {} })).resolves.toBeInstanceOf(Uint8Array)
      await expect(renderToDocx(result, { onWarn: () => {} })).resolves.toBeInstanceOf(Uint8Array)
      renders++
    }
    expect(renders).toBeGreaterThan(10)
  })

  it('ends with the same files as the finished spec', async () => {
    const compiler = createSpecStreamCompiler<Spec>()
    compiler.push(patchLines(reportSpec()).join('\n') + '\n')
    const streamed = unzip(await renderToDocx(compiler.getResult())).xml('word/document.xml')
    const direct = unzip(await renderToDocx(reportSpec())).xml('word/document.xml')
    // The writer numbers pictures with a counter shared by all renders in the process.
    const ids = (xml: string): string => xml.replace(/<wp:docPr id="\d+"/g, '<wp:docPr id="0"')
    expect(ids(streamed)).toBe(ids(direct))
  })

  it('reports what is still missing instead of throwing', async () => {
    const compiler = createSpecStreamCompiler<Spec>()
    // The report is there, its Chapters are not.
    compiler.push(patchLines(reportSpec()).slice(0, 2).join('\n') + '\n')
    const codes: string[] = []
    await renderToPptx(compiler.getResult(), { onWarn: (w) => codes.push(w.code) })
    expect(codes).toContain('missing-element')
  })
})
