import type { UIElement } from '@json-render/core'
import { defineComponent, h, type Component, type PropType, type VNode } from 'vue'

import type { StandardComponentDefinitions, StandardComponentProps } from './catalog'

export type ReportProps = { [K in keyof StandardComponentDefinitions]: StandardComponentProps<K> }

/** A standard element of another catalog, built by hand: the report maps its own elements onto them. */
export const element = (type: string, props: Record<string, unknown>): UIElement => ({ type, props, children: [] })

const elementProp = { element: { type: Object as PropType<UIElement>, required: true as const } }

/** A registry component: it receives the resolved element and its rendered children. */
export const defineReport = <K extends keyof ReportProps>(
  name: K,
  render: (props: ReportProps[K], children: VNode[]) => VNode | VNode[] | null,
): Component =>
  defineComponent({
    name: `Report${name}`,
    // `@json-render/vue` also passes emit, on, bindings and loading; they are not attributes.
    inheritAttrs: false,
    props: elementProp,
    setup(props, { slots }) {
      return () => render(props.element.props as ReportProps[K], slots.default?.() ?? [])
    },
  })

export const call = (component: Component | undefined, el: UIElement, children: VNode[] = []): VNode => {
  if (!component) throw new Error(`The ${el.type} component is missing from the registry.`)
  return h(component, { element: el }, { default: () => children })
}
