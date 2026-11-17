import { defaultBaseTheme, resolveBaseTheme, type BaseTheme, type BaseThemeInput } from 'json-render-office'

export interface Theme extends BaseTheme {
  /** Points. */
  sizes: { title: number; coverTitle: number; subtitle: number; body: number }
}

export interface ThemeInput extends BaseThemeInput {
  sizes?: Partial<Theme['sizes']>
}

export const defaultTheme: Theme = {
  ...defaultBaseTheme,
  sizes: { title: 30, coverTitle: 40, subtitle: 20, body: 18 },
}

export const resolveTheme = (input?: ThemeInput): Theme => ({
  ...resolveBaseTheme(input),
  sizes: { ...defaultTheme.sizes, ...input?.sizes },
})
