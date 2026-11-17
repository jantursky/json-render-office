# API note

Community renderers that turn a json-render spec into editable Office files. Not affiliated with Vercel.

## Packages

| Package                      | Built on            | Output                              |
| ---------------------------- | ------------------- | ----------------------------------- |
| `json-render-pptx`           | `vue-pptx-document` | `.pptx`                             |
| `json-render-docx`           | `vue-docx-document` | `.docx`                             |
| `json-render-office` (later) | both                | shared theme, units, report catalog |

## Entry points (same shape as `@json-render/react-pdf`)

- `.`: everything below plus the render functions.
- `./server`: `schema`, `standardComponentDefinitions` and types only. No Vue, no engine. Safe in a route handler that only builds prompts.

## Public surface of `json-render-pptx`

```ts
export { schema }                          // json-render schema (flat spec: root + elements)
export { standardComponentDefinitions }    // Zod props, slots, description, example per component
export type StandardComponentProps<K>
export interface RenderOptions {
  registry?: Record<string, Component>     // custom Vue components, keyed by catalog type
  includeStandard?: boolean                // default true
  state?: Record<string, unknown>          // merged over spec.state
  theme?: Partial<Theme>
  onWarn?: (w: RenderWarning) => void      // skipped element, unknown type, bad prop
}
export function renderToBuffer(spec, options?): Promise<Uint8Array>
export function renderToBlob(spec, options?): Promise<Blob>
export function renderToFile(spec, path, options?): Promise<void>   // Node only, lazy fs import
export function defineRegistry(catalog, { components }): { registry }
```

## Rendering

1. `spec.state` merged with `options.state`; each element's `visible` and prop expressions (`$state`, `$cond`, `$template`, `repeat`) are resolved with `@json-render/core` helpers.
2. A Vue component walks the spec from `root` and creates `h(registry[type], props, children)`. Missing roots, missing child keys and unknown types are skipped and reported through `onWarn`, so partial specs never throw.
3. The tree is mounted with `vue-pptx-document` and written to a buffer.
4. Standard components wrap vue-pptx primitives. Slide layouts (`title`, `title-content`, `two-column`, `section`, `blank`) place children into fixed regions, so the model never emits coordinates.

## Standard components, first pass

pptx: `Deck` (root), `Slide`, `Title`, `Subtitle`, `Text`, `BulletList`, `Image`, `Table`, `Chart`, `Shape`, `SpeakerNotes`, `SlideNumber`.
docx: `Document` (root), `Section`, `Heading`, `Paragraph`, `List`, `Table`, `Image`, `PageBreak`, `Header`, `Footer`, `PageNumber`, `TableOfContents`. No `Chart` in v1.

Optional props use `.nullable()` (strict JSON Schema, as in the first-party renderers). Limits live in the Zod schemas: bullets per slide, characters per title and bullet, rows and columns per table.

## Rules

- Units in the catalog: inches for slides, points for docx text sizes; positions are never exposed except through layouts.
- Images: only `data:` and `https:` sources. Local paths are rejected with a warning.
- `zod` `^4` and `@json-render/core` are peers, `vue` is a peer.
- Errors: render functions reject only on engine failures; bad spec content is a warning.
