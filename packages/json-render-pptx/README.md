# json-render-pptx

Render [json-render](https://github.com/vercel-labs/json-render) specs to PowerPoint (.pptx) files. Text, tables and charts are real Office objects, so the result stays editable. Works in Node and the browser.

> Community project. Not affiliated with or endorsed by Vercel. "json-render" is the name of the Vercel Labs project this package renders for.

## Install

```bash
npm install json-render-pptx @json-render/core zod vue
```

## Example

```ts
import { defineCatalog } from '@json-render/core'
import { schema, standardComponentDefinitions, renderToBuffer } from 'json-render-pptx'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })
// catalog.prompt() teaches the model the components.
```

See the [docs](https://json-render-office-docs.vercel.app) for the components, themes, streaming and the AI SDK. The [repository README](https://github.com/jantursky/json-render-office) has the compatibility table and what is not covered yet.

[Repository](https://github.com/jantursky/json-render-office) · MIT
