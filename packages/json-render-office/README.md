# json-render-office

Shared pieces of the [json-render](https://github.com/vercel-labs/json-render) Office renderers: the spec walker, safe image loading, the base theme, the schema helper and `validateProps`.

You normally install [`json-render-pptx`](https://www.npmjs.com/package/json-render-pptx), [`json-render-docx`](https://www.npmjs.com/package/json-render-docx) or [`json-render-report`](https://www.npmjs.com/package/json-render-report) instead. Use this package to build your own Office renderer on the same pieces.

```ts
import { walkSpec, preloadImages, resolveBaseTheme, validateProps } from 'json-render-office'
```

- `walkSpec(spec, { registry, state, warn })` turns a spec into Vue nodes. A missing root, missing children and unknown types are skipped with a warning.
- `preloadImages` loads `https:` and `data:` images with a timeout, a type check and a 10 MB cap. Everything else is blocked.
- `resolveBaseTheme` merges a partial theme over the defaults.

> Community project. Not affiliated with or endorsed by Vercel.

[Repository and docs](https://github.com/jantursky/json-render-office) · MIT
