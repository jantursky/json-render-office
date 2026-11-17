import type { Spec, UIElement } from '@json-render/core'
import {
  evaluateVisibility,
  getByPath,
  resolveElementProps,
  resolveRepeatItemStatePath,
  resolveRepeatStatePath,
  type PropResolutionContext,
} from '@json-render/core'
import { defineComponent, h, provide, type Component, type VNode } from 'vue'
import { Presentation, renderToBlob as pptxRenderToBlob, renderToBuffer as pptxRenderToBuffer } from 'vue-pptx-document'

import { THEME } from './components/context'
import { standardComponents } from './components/standard'
import { resolveTheme, type ThemeInput } from './theme'

export type ComponentRegistry = Record<string, Component>

export interface RenderWarning {
  code: 'missing-root' | 'missing-element' | 'unknown-type' | 'bad-props' | 'bad-repeat'
  message: string
  /** The element key, when the warning is about one element. */
  element?: string
}

export interface RenderOptions {
  /** Custom components by catalog type. They win over the standard ones. */
  registry?: ComponentRegistry
  /** Set to false to use only `registry`. Default true. */
  includeStandard?: boolean
  /** Merged over `spec.state`. */
  state?: Record<string, unknown>
  theme?: ThemeInput
  /** Receives every skipped element and unusable prop. Without it, warnings go to `console.warn`. */
  onWarn?: (warning: RenderWarning) => void
}

interface Walk {
  spec: Spec
  registry: ComponentRegistry
  state: Record<string, unknown>
  warn: (warning: RenderWarning) => void
}

interface Scope {
  item?: unknown
  index?: number
  basePath?: string
}

const asProps = (element: UIElement): UIElement => element

function walk(key: string, ctx: Walk, scope: Scope = {}): VNode[] {
  const element = ctx.spec.elements[key]
  if (!element) {
    ctx.warn({ code: 'missing-element', message: `Element "${key}" is not in the spec (yet).`, element: key })
    return []
  }

  const resolution: PropResolutionContext = {
    stateModel: ctx.state,
    repeatItem: scope.item,
    repeatIndex: scope.index,
    repeatBasePath: scope.basePath,
  }

  try {
    if (element.visible !== undefined && !evaluateVisibility(element.visible, resolution)) return []
  } catch {
    ctx.warn({ code: 'bad-props', message: `Element "${key}" has an unusable visible condition.`, element: key })
    return []
  }

  const Component = ctx.registry[element.type]
  if (!Component) {
    ctx.warn({ code: 'unknown-type', message: `No component for type "${element.type}".`, element: key })
    return []
  }

  let resolved: UIElement
  try {
    resolved = asProps({ ...element, props: resolveElementProps(element.props, resolution) })
  } catch {
    ctx.warn({ code: 'bad-props', message: `Props of "${key}" could not be resolved.`, element: key })
    return []
  }

  const children = (resolved.children ?? []).flatMap((child) => walk(child, ctx, scope))
  return [h(Component, { key, element: resolved }, { default: () => children })]
}

function walkRepeat(key: string, ctx: Walk, scope: Scope): VNode[] | undefined {
  const repeat = ctx.spec.elements[key]?.repeat
  if (!repeat) return undefined
  const statePath = resolveRepeatStatePath(repeat.statePath, scope.basePath)
  if (statePath === undefined) {
    ctx.warn({ code: 'bad-repeat', message: `Element "${key}" repeats outside of a repeat scope.`, element: key })
    return []
  }
  const items = (getByPath(ctx.state, statePath) as unknown[] | undefined) ?? []
  return items.flatMap((item, index) => {
    const child: Scope = { item, index, basePath: resolveRepeatItemStatePath(statePath, index) }
    return (ctx.spec.elements[key]?.children ?? []).flatMap((childKey) => walk(childKey, ctx, child))
  })
}

/** Builds the Vue component that stands for a spec. Missing roots and elements render nothing. */
export function createDocument(spec: Spec, options: RenderOptions = {}): Component {
  const warn =
    options.onWarn ??
    ((w: RenderWarning) => {
      console.warn(`[json-render-pptx] ${w.message}`)
    })
  const theme = resolveTheme(options.theme)
  const ctx: Walk = {
    spec,
    registry: { ...(options.includeStandard === false ? {} : standardComponents), ...options.registry },
    state: { ...spec.state, ...options.state },
    warn,
  }

  return defineComponent({
    name: 'JsonRenderDocument',
    setup() {
      provide(THEME, theme)
      return () => {
        const root = spec.root && spec.root in spec.elements
        if (!root) warn({ code: 'missing-root', message: 'The spec has no root element yet.' })
        const nodes = root ? (walkRepeat(spec.root, ctx, {}) ?? walk(spec.root, ctx)) : []
        // The writer needs a Presentation at the top, also while a streamed spec has none yet.
        return nodes.length > 0 ? nodes : h(Presentation)
      }
    },
  })
}

/** Renders a spec to the bytes of a .pptx file. Works in Node, workers and the browser. */
export function renderToBuffer(spec: Spec, options?: RenderOptions): Promise<Uint8Array> {
  return pptxRenderToBuffer(createDocument(spec, options))
}

/** Renders a spec to a Blob with the PowerPoint MIME type. */
export function renderToBlob(spec: Spec, options?: RenderOptions): Promise<Blob> {
  return pptxRenderToBlob(createDocument(spec, options))
}

/** Renders a spec to a file. Node only: `node:fs` is loaded on first use. */
export async function renderToFile(spec: Spec, path: string, options?: RenderOptions): Promise<void> {
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path, await renderToBuffer(spec, options))
}
