import type { Spec } from '@json-render/core'
import type { PropsIssue } from 'json-render-report'

import { fileName, saveBlob, type Format } from './download'
import { reportTitle } from './spec'

// The writers and the validator live in the main entry; importing it on demand keeps the first paint small.
const library = () => import('json-render-report')

export async function validateSpec(spec: Spec): Promise<PropsIssue[]> {
  const { validateProps } = await library()
  return validateProps(spec)
}

/** Renders the spec to the chosen format and saves it under the report's title. */
export async function exportReport(spec: Spec, format: Format): Promise<void> {
  const { renderToDocxBlob, renderToPptxBlob } = await library()
  const blob = format === 'pptx' ? await renderToPptxBlob(spec) : await renderToDocxBlob(spec)
  saveBlob(blob, fileName(reportTitle(spec), format))
}
