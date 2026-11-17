export { walkSpec, type ComponentRegistry, type WalkOptions } from './walk'
export { consoleWarn, type RenderWarning, type WarnHandler, type WarningCode } from './warnings'
export {
  classifySource,
  fetchImage,
  IMAGE_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
  preloadImages,
  type ImageLoader,
  type ImageWarning,
  type SourceKind,
} from './images'
export { validateProps, type PropDefinitions, type PropsIssue } from './validate'
export { defaultBaseTheme, resolveBaseTheme, type BaseTheme, type BaseThemeInput } from './theme'
export { COMMON_RULES, defineOfficeSchema } from './schema'
