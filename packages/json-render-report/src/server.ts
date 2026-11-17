// Server-safe entry: schema and catalog definitions only. Imports neither Vue nor a writer.
export { schema, type ReportSchema } from './schema'
export { standardComponentDefinitions, type StandardComponentDefinitions, type StandardComponentProps } from './catalog'
export type { Spec } from '@json-render/core'
