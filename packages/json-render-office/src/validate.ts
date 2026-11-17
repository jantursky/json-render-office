import type { Spec } from '@json-render/core'

export interface PropsIssue {
  element: string
  type: string
  message: string
}

export type PropDefinitions = Record<
  string,
  {
    props: {
      safeParse: (value: unknown) => { success: boolean; error?: { message: string } }
      /** Present on Zod objects. */
      shape?: Record<string, { safeParse: (value: unknown) => { success: boolean } }>
    }
  }
>

/**
 * json-render catalogs write optional props as nullable, so a model may leave the key out where the
 * schema says `null`. A missing key counts as `null` when the schema accepts it.
 */
export function withNullDefaults(
  props: Record<string, unknown>,
  definition: PropDefinitions[string],
): Record<string, unknown> {
  const filled = { ...props }
  for (const [name, schema] of Object.entries(definition.props.shape ?? {})) {
    if (!(name in filled) && schema.safeParse(null).success) filled[name] = null
  }
  return filled
}

/**
 * Checks every element's props against the Zod schema of its component. json-render's own
 * `catalog.validate` checks the spec shape; this adds the per-component limits (bullet count,
 * text length). Types without a definition are skipped.
 */
export function validateProps(spec: Spec, definitions: PropDefinitions): PropsIssue[] {
  const issues: PropsIssue[] = []
  for (const [key, element] of Object.entries(spec.elements)) {
    const definition = Object.hasOwn(definitions, element.type) ? definitions[element.type] : undefined
    const result = definition?.props.safeParse(withNullDefaults(element.props, definition))
    if (result && !result.success) {
      issues.push({ element: key, type: element.type, message: result.error?.message ?? 'Invalid props.' })
    }
  }
  return issues
}
