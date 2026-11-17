import type { Spec } from '@json-render/core'

/** True once the spec has a root and that root's element has arrived. */
export const hasContent = (spec: Spec | null): spec is Spec =>
  spec !== null && typeof spec.root === 'string' && Boolean(spec.elements[spec.root])

export function reportTitle(spec: Spec): string {
  const title = spec.elements[spec.root]?.props.title
  return typeof title === 'string' && title.trim() ? title : 'report'
}
