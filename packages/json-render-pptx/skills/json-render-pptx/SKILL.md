---
name: json-render-pptx
description: Render json-render specs to editable PowerPoint (.pptx) files with native text, tables and charts. Use when generating slide decks from a json-render catalog, building a slide catalog for a model, or streaming a deck spec.
---

# json-render-pptx

Community renderer for [json-render](https://github.com/vercel-labs/json-render): a spec in, an editable `.pptx` out. Text boxes, tables and charts are real PowerPoint objects, never pictures. Not affiliated with Vercel.

## Install

```bash
npm install json-render-pptx @json-render/core zod vue
```

`@json-render/core`, `zod` (v4) and `vue` are peer dependencies.

## Quick start

```ts
import { defineCatalog } from '@json-render/core'
import { schema, standardComponentDefinitions, renderToBuffer } from 'json-render-pptx'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })

// Give the model the catalog: catalog.prompt() for the system prompt.
const spec = await generateSpec(catalog.prompt(), 'A 5 slide deck on Q3 results')

const bytes = await renderToBuffer(spec) // Uint8Array, works in Node and the browser
```

Also: `renderToBlob(spec)` (browser download), `renderToFile(spec, path)` (Node only).

## Spec shape

Flat `{ root, elements }`. The root is a `Deck`, its children are `Slide`s, and every element has `type`, `props` and a `children` array of element keys (empty for leaves).

```json
{
  "root": "deck",
  "elements": {
    "deck": { "type": "Deck", "props": { "title": "Review", "author": null, "subject": null }, "children": ["s1"] },
    "s1": {
      "type": "Slide",
      "props": { "layout": "title-content", "background": null, "notes": null, "slideNumber": true },
      "children": ["t", "b"]
    },
    "t": { "type": "Title", "props": { "text": "What changed", "align": null, "color": null }, "children": [] },
    "b": {
      "type": "BulletList",
      "props": { "items": ["Revenue up 24%", "Churn down"], "ordered": null, "fontSize": null, "color": null },
      "children": []
    }
  }
}
```

Optional props are `nullable()`: always send them, as `null` when unused.

## Standard components

Deck, Slide (layouts `title`, `title-content`, `section`, `blank`), Title, Subtitle, Text, BulletList, Columns and Column (side by side), Table, Chart (bar, line, pie, doughnut, area), Image. Slides never use coordinates. Limits live in the Zod schemas (7 bullets, 6 table columns, 10 table rows, 12 chart labels). Check them with `validateProps(spec)`; `catalog.validate(spec)` only checks the spec shape.

## Options

```ts
renderToBuffer(spec, {
  theme: { colors: { accent: '#0b5fff' }, fonts: { heading: 'Georgia' }, sizes: { title: 32 } },
  state: { name: 'Ada' }, // merged over spec.state, for $state expressions
  registry: { Callout }, // custom Vue components by catalog type
  loadImage: (src) => dataUri, // replace the https image loader (proxy, allowlist)
  onWarn: (w) => log(w), // skipped elements, blocked images
})
```

## Custom components

A registry component is a Vue component with an `element` prop (the resolved `{ type, props }`) and children in the default slot. Build slide content with `vue-pptx-document` components (`Text`, `Shape`, `View`).

## Streaming

Partial specs render without throwing: a missing root, missing children and unknown types are skipped and reported through `onWarn`. Feed `createSpecStreamCompiler()` from `@json-render/core` and render `result` on every chunk.

## Images

Only `https:` URLs and `data:` images are read (10 s timeout, 10 MB cap, PNG, JPEG, GIF or SVG). Paths, `file:` and `http:` are blocked with a `blocked-image` warning.

## Server-safe import

`import { schema, standardComponentDefinitions } from 'json-render-pptx/server'` pulls in neither Vue nor the PowerPoint writer. Use it in routes that only build prompts.
