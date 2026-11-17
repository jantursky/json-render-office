// Vue-free entry: everything a catalog needs to build prompts and validate specs, nothing a writer needs.
export { COMMON_RULES, defineOfficeSchema } from './schema'
export { defaultBaseTheme, resolveBaseTheme, type BaseTheme, type BaseThemeInput } from './theme'
export { validateProps, type PropDefinitions, type PropsIssue } from './validate'
export type { RenderWarning, WarnHandler, WarningCode } from './warnings'
