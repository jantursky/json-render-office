import type { Spec, UIElement } from '@json-render/core'
import {
  evaluateVisibility,
  getByPath,
  resolveElementProps,
  resolveRepeatItemStatePath,
  resolveRepeatStatePath,
  type PropResolutionContext,
} from '@json-render/core'
import { h, type Component, type VNode } from 'vue'

import type { WarnHandler } from './warnings'

/** A spec while it streams in: `root` and `elements` do not exist until the first patches land. */
export type StreamedSpec = Partial<Spec>

export type ComponentRegistry = Record<string, Component>

export interface WalkOptions {
  registry: ComponentRegistry
  /** Merged from `spec.state` and the caller's state. */
  state: Record<string, unknown>
  warn: WarnHandler
}

interface Scope {
  item?: unknown
  index?: number
  basePath?: string
}

function walkElement(key: string, spec: StreamedSpec, options: WalkOptions, scope: Scope): VNode[] {
  const element = spec.elements?.[key]
  if (!element) {
    options.warn({ code: 'missing-element', message: `Element "${key}" is not in the spec (yet).`, element: key })
    return []
  }

  const resolution: PropResolutionContext = {
    stateModel: options.state,
    repeatItem: scope.item,
    repeatIndex: scope.index,
    repeatBasePath: scope.basePath,
  }

  try {
    if (element.visible !== undefined && !evaluateVisibility(element.visible, resolution)) return []
  } catch {
    options.warn({ code: 'bad-props', message: `Element "${key}" has an unusable visible condition.`, element: key })
    return []
  }

  const Component = options.registry[element.type]
  if (!Component) {
    options.warn({ code: 'unknown-type', message: `No component for type "${element.type}".`, element: key })
    return []
  }

  let resolved: UIElement
  try {
    resolved = { ...element, props: resolveElementProps(element.props, resolution) }
  } catch {
    options.warn({ code: 'bad-props', message: `Props of "${key}" could not be resolved.`, element: key })
    return []
  }

  const children = renderChildren(resolved, spec, options, scope)
  return [h(Component, { key, element: resolved }, { default: () => children })]
}

function renderChildren(element: UIElement, spec: StreamedSpec, options: WalkOptions, scope: Scope): VNode[] {
  const keys = element.children ?? []
  if (!element.repeat) return keys.flatMap((child) => walkElement(child, spec, options, scope))

  const statePath = resolveRepeatStatePath(element.repeat.statePath, scope.basePath)
  if (statePath === undefined) {
    options.warn({ code: 'bad-repeat', message: 'A repeat is used outside of a repeat scope.' })
    return []
  }
  const items = (getByPath(options.state, statePath) as unknown[] | undefined) ?? []
  return items.flatMap((item, index) => {
    const child: Scope = { item, index, basePath: resolveRepeatItemStatePath(statePath, index) }
    return keys.flatMap((childKey) => walkElement(childKey, spec, options, child))
  })
}

/**
 * Turns a spec into Vue nodes by looking each element's type up in the registry. A missing root,
 * missing children and unknown types are skipped with a warning, so a half-streamed spec renders.
 */
export function walkSpec(spec: StreamedSpec, options: WalkOptions): VNode[] {
  // A stream starts as `{}`: neither `root` nor `elements` exist until the first patch lands.
  if (!spec.root || !(spec.root in (spec.elements ?? {}))) {
    options.warn({ code: 'missing-root', message: 'The spec has no root element yet.' })
    return []
  }
  return walkElement(spec.root, spec, options, {})
}
