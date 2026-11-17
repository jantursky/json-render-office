---
name: json-render-docx
description: Render json-render specs to editable Word (.docx) files with real headings, lists, tables, headers, footers and page numbers. Use when generating Word documents from a json-render catalog, building a document catalog for a model, or streaming a document spec.
---

# json-render-docx

Community renderer for [json-render](https://github.com/vercel-labs/json-render): a spec in, an editable `.docx` out. Headings use Word styles, lists use numbering, tables have repeating header rows and page numbers are fields. Not affiliated with Vercel.

## Install

```bash
npm install json-render-docx @json-render/core zod vue
```

## Quick start

```ts
import { defineCatalog } from '@json-render/core'
import { schema, standardComponentDefinitions, renderToBuffer } from 'json-render-docx'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })
const spec = await generateSpec(catalog.prompt(), 'A project status report')

const bytes = await renderToBuffer(spec) // Uint8Array, works in Node and the browser
```

Also: `renderToBlob(spec)`, `renderToFile(spec, path)` (Node only).

## Spec shape

Flat `{ root, elements }`. The root is a `Document`, its children are `Section`s. A Section starts with `Header` and `Footer`, then the content. Every element has `type`, `props` and a `children` array of keys (empty for leaves). Optional props are `nullable()`: send `null` when unused.

```json
{
  "root": "doc",
  "elements": {
    "doc": {
      "type": "Document",
      "props": { "title": "Report", "author": null, "language": "en-US" },
      "children": ["sec"]
    },
    "sec": {
      "type": "Section",
      "props": { "size": null, "orientation": null, "margin": null },
      "children": ["h", "p"]
    },
    "h": { "type": "Heading", "props": { "text": "Summary", "level": 1 }, "children": [] },
    "p": {
      "type": "Paragraph",
      "props": {
        "text": "Revenue grew.",
        "align": null,
        "bold": null,
        "italic": null,
        "color": null,
        "fontSize": null
      },
      "children": []
    }
  }
}
```

## Standard components

Document, Section (A4, Letter, A3, A5, Legal; portrait or landscape; margin in inches), Header, Footer (with "Page X of Y"), Title, Heading (levels 1 to 3), Paragraph, List, Table, Image (width in inches), PageBreak, TableOfContents. There is no Chart yet. Check limits with `validateProps(spec)`.

## Options

```ts
renderToBuffer(spec, {
  theme: { fonts: { body: 'Georgia' }, colors: { tableHeader: '#1f2937' }, sizes: { body: 11 } },
  state,
  registry,
  loadImage,
  onWarn, // as in json-render-pptx
})
```

A Document holds only Sections and a Section holds blocks; anything else is dropped. A spec with no Section yet renders one empty page.

## Images

Only `https:` URLs and `data:` images are read (10 s timeout, 10 MB cap). Others are blocked with a `blocked-image` warning.

## Server-safe import

`json-render-docx/server` exports the schema and definitions without Vue or the Word writer.
