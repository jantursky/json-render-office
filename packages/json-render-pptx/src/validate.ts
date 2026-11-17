import type { Spec } from '@json-render/core'

import { standardComponentDefinitions } from './catalog'

export interface PropsIssue {
  element: string
  type: string
  message: string
}

/**
 * Checks every element's props against the Zod schema of its component. json-render's own
 * `catalog.validate` checks the spec shape; this adds the per-component limits (bullet count,
 * text length). Types that are not standard components are skipped.
 */
export function validateProps(
  spec: Spec,
  definitions: Record<
    string,
    { props: { safeParse: (value: unknown) => { success: boolean; error?: { message: string } } } }
  > = standardComponentDefinitions,
): PropsIssue[] {
  const issues: PropsIssue[] = []
  for (const [key, element] of Object.entries(spec.elements)) {
    const result = definitions[element.type]?.props.safeParse(element.props)
    if (result && !result.success) {
      issues.push({ element: key, type: element.type, message: result.error?.message ?? 'Invalid props.' })
    }
  }
  return issues
}
