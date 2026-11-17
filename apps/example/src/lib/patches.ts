import type { Spec } from '@json-render/core'

/** The spec as the JSONL patch lines a model would stream: the root, then each element parent first. */
export function specToPatches(spec: Spec): string[] {
  const lines = [JSON.stringify({ op: 'add', path: '/root', value: spec.root })]
  const visit = (key: string): void => {
    const element = spec.elements[key]
    if (!element) return
    lines.push(JSON.stringify({ op: 'add', path: `/elements/${key}`, value: element }))
    element.children?.forEach(visit)
  }
  visit(spec.root)
  return lines.map((line) => `${line}\n`)
}
