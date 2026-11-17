// Server-safe entry: schema and catalog definitions only. Imports neither Vue nor the Word writer.
export { schema, type DocxSchema } from './schema'
export { standardComponentDefinitions, type StandardComponentDefinitions, type StandardComponentProps } from './catalog'
export type { Spec } from '@json-render/core'
