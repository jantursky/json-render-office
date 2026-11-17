export type WarningCode =
  'missing-root' | 'missing-element' | 'unknown-type' | 'bad-props' | 'bad-repeat' | 'blocked-image' | 'image-failed'

export interface RenderWarning {
  code: WarningCode
  message: string
  /** The element key, when the warning is about one element. */
  element?: string
}

export type WarnHandler = (warning: RenderWarning) => void

/** The default handler: one console line per warning, tagged with the package that renders. */
export const consoleWarn =
  (tag: string): WarnHandler =>
  (warning) => {
    console.warn(`[${tag}] ${warning.message}`)
  }
