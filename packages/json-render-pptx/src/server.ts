// Server-safe entry: schema and catalog definitions only. Imports neither Vue nor the PowerPoint writer.
export { schema, type PptxSchema } from './schema'
export {
  SLIDE_LAYOUTS,
  standardComponentDefinitions,
  type StandardComponentDefinitions,
  type StandardComponentProps,
} from './catalog'
export type { Spec } from '@json-render/core'
