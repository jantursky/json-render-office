import type { Spec } from '@json-render/core'
import {
  consoleWarn,
  createImageLoader,
  preloadImages,
  walkSpec,
  type ComponentRegistry,
  type ImageLoadOptions,
  type ImageLoader,
  type RenderWarning,
  type WalkOptions,
} from 'json-render-office'
import { defineComponent, h, provide, type Component } from 'vue'
import {
  Document,
  Section,
  renderToBlob as docxRenderToBlob,
  renderToBuffer as docxRenderToBuffer,
} from 'vue-docx-document'

import { standardComponentDefinitions } from './catalog'
import { IMAGES, THEME } from './components/context'
import { standardComponents } from './components/standard'
import { resolveTheme, type ThemeInput } from './theme'

export type { ComponentRegistry, RenderWarning }

export interface RenderOptions {
  /** Custom components by catalog type. They win over the standard ones. */
  registry?: ComponentRegistry
  /** Set to false to use only `registry`. Default true. */
  includeStandard?: boolean
  /** Merged over `spec.state`. */
  state?: Record<string, unknown>
  theme?: ThemeInput
  /** Loads https images. Default: the built-in loader, configured by `imageOptions`. */
  loadImage?: ImageLoader
  /** Limits for remote images: timeout, abort signal, concurrency, byte cap and host allowlist. */
  imageOptions?: ImageLoadOptions
  /** Receives every skipped element and unusable prop. Without it, warnings go to `console.warn`. */
  onWarn?: (warning: RenderWarning) => void
}

/** Builds the Vue component that stands for a spec. Missing roots and elements render an empty page. */
export function createDocument(
  spec: Spec,
  options: RenderOptions = {},
  images: ReadonlyMap<string, string> = new Map(),
): Component {
  const warn = options.onWarn ?? consoleWarn('json-render-docx')
  const theme = resolveTheme(options.theme)
  const walk: WalkOptions = {
    registry: { ...(options.includeStandard === false ? {} : standardComponents), ...options.registry },
    state: { ...spec.state, ...options.state },
    warn,
    definitions: standardComponentDefinitions,
  }

  return defineComponent({
    name: 'JsonRenderDocument',
    setup() {
      provide(THEME, theme)
      provide(IMAGES, images)
      return () => {
        const nodes = walkSpec(spec, walk)
        // The writer needs a Document with a Section, also while a streamed spec has neither yet.
        return nodes.length > 0 ? nodes : h(Document, null, () => h(Section))
      }
    },
  })
}

async function prepare(spec: Spec, options: RenderOptions = {}): Promise<Component> {
  const warn = options.onWarn ?? consoleWarn('json-render-docx')
  const images = await preloadImages(
    spec,
    { ...spec.state, ...options.state },
    options.loadImage ?? createImageLoader(options.imageOptions),
    (w) => {
      warn({
        code: w.blocked ? 'blocked-image' : 'image-failed',
        message: `Image "${w.src.slice(0, 80)}": ${w.message}`,
      })
    },
    options.imageOptions,
  )
  return createDocument(spec, options, images)
}

/** Renders a spec to the bytes of a .docx file. Works in Node, workers and the browser. */
export async function renderToBuffer(spec: Spec, options?: RenderOptions): Promise<Uint8Array> {
  return docxRenderToBuffer(await prepare(spec, options))
}

/** Renders a spec to a Blob with the Word MIME type. */
export async function renderToBlob(spec: Spec, options?: RenderOptions): Promise<Blob> {
  return docxRenderToBlob(await prepare(spec, options))
}

/** Renders a spec to a file. Node only: `node:fs` is loaded on first use. */
export async function renderToFile(spec: Spec, path: string, options?: RenderOptions): Promise<void> {
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path, await renderToBuffer(spec, options))
}
