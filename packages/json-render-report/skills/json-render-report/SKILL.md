---
name: json-render-report
description: One json-render report spec rendered to a web page, an editable PowerPoint deck and a Word document. Use when the same model-generated content must come out as a web preview, slides and a document, or when building a live preview with download buttons.
---

# json-render-report

A single catalog for reports: `Report`, `Chapter`, `Paragraph`, `BulletList`, `Table`, `Chart`, `Image`. The same spec becomes a cover plus one slide per Chapter (PPTX), a title plus a heading per Chapter (DOCX) and a themed web page. Built on `json-render-pptx` and `json-render-docx`. Not affiliated with Vercel.

## Install

```bash
npm install json-render-report @json-render/core zod vue
npm install @json-render/vue   # only for the web preview
```

## Quick start

```ts
import { defineCatalog } from '@json-render/core'
import { schema, standardComponentDefinitions, renderToPptx, renderToDocx } from 'json-render-report'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })
const spec = await generateSpec(catalog.prompt(), 'A quarterly review')

const pptx = await renderToPptx(spec) // Uint8Array
const docx = await renderToDocx(spec) // Uint8Array
```

Blob variants: `renderToPptxBlob`, `renderToDocxBlob`. Options are those of `json-render-pptx` and `json-render-docx` (`theme`, `state`, `loadImage`, `onWarn`).

## Web preview

```ts
import { JSONUIProvider, Renderer } from '@json-render/vue'
import { webRegistry, webStyles, themeStyle } from 'json-render-report/web'

// <div :style="themeStyle(theme)"> <JSONUIProvider :registry="webRegistry"> <Renderer :spec="spec" :registry="webRegistry" /> ...
```

`webStyles` is an optional stylesheet string with `jr-` prefixed classes. The page reads the same theme tokens as the files.

## Streaming

Render `result` of `createSpecStreamCompiler()` on every chunk. Every renderer skips what has not arrived yet.

## What maps where

- Chart: a native, editable chart in the deck; a table of the same numbers in the document (Word charts are not covered yet); an SVG chart on the web.
- Chapter `notes` become speaker notes in the deck and are ignored elsewhere.
- PDF output is not shipped. A PDF can be made from the same spec by mapping it to `@json-render/react-pdf`.

## Rules for the model

Root is a `Report` with `Chapter` children. One idea per Chapter, at most 6 bullets, about 8 words per title. Table rows have one string per column; chart series have one value per label. Check limits with `validateProps(spec)`.

`json-render-report/server` exports the schema and definitions without Vue or a writer.
