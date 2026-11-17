<p align="center">
  <img src="https://raw.githubusercontent.com/jantursky/json-render-office/main/.github/assets/banner.svg" alt="JSON Render Office: editable office files from json-render specs" width="420">
</p>

# json-render-docx

Render [json-render](https://github.com/vercel-labs/json-render) specs to Word (.docx) files. Text, lists and tables are real Office objects, so the result stays editable. Works in Node and the browser.

> Community project. Not affiliated with or endorsed by Vercel. "json-render" is the name of the Vercel Labs project this package renders for.

## Install

```bash
npm install json-render-docx @json-render/core zod vue
```

## Example

```ts
import { defineCatalog } from '@json-render/core'
import { schema, standardComponentDefinitions, renderToBuffer } from 'json-render-docx'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })
// catalog.prompt() teaches the model the components.
```

See the [docs](https://json-render-office-docs.vercel.app) for the components, themes, streaming and the AI SDK. The [repository README](https://github.com/jantursky/json-render-office) has the compatibility table and what is not covered yet.

[Repository](https://github.com/jantursky/json-render-office) · MIT
