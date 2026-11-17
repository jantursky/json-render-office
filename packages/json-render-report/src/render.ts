import type { Spec } from '@json-render/core'
import {
  renderToBuffer as renderDocx,
  renderToBlob as renderDocxBlob,
  type RenderOptions as DocxOptions,
} from 'json-render-docx'
import {
  renderToBuffer as renderPptx,
  renderToBlob as renderPptxBlob,
  type RenderOptions as PptxOptions,
} from 'json-render-pptx'

import { docxRegistry } from './docx'
import { pptxRegistry } from './pptx'

/** Renders a report spec to the bytes of a .pptx file: a cover and one slide per Chapter. */
export const renderToPptx = (spec: Spec, options: PptxOptions = {}): Promise<Uint8Array> =>
  renderPptx(spec, { ...options, registry: { ...pptxRegistry, ...options.registry } })

export const renderToPptxBlob = (spec: Spec, options: PptxOptions = {}): Promise<Blob> =>
  renderPptxBlob(spec, { ...options, registry: { ...pptxRegistry, ...options.registry } })

/** Renders a report spec to the bytes of a .docx file: a title, then a heading and content per Chapter. */
export const renderToDocx = (spec: Spec, options: DocxOptions = {}): Promise<Uint8Array> =>
  renderDocx(spec, { ...options, registry: { ...docxRegistry, ...options.registry } })

export const renderToDocxBlob = (spec: Spec, options: DocxOptions = {}): Promise<Blob> =>
  renderDocxBlob(spec, { ...options, registry: { ...docxRegistry, ...options.registry } })
