import { defaultBaseTheme, resolveBaseTheme, type BaseTheme, type BaseThemeInput } from 'json-render-office'

export interface Theme extends BaseTheme {
  /** Points. */
  sizes: { body: number; title: number; h1: number; h2: number; h3: number }
}

export interface ThemeInput extends BaseThemeInput {
  sizes?: Partial<Theme['sizes']>
}

export const defaultTheme: Theme = {
  ...defaultBaseTheme,
  sizes: { body: 11, title: 28, h1: 18, h2: 14, h3: 12 },
}

export const resolveTheme = (input?: ThemeInput): Theme => ({
  ...resolveBaseTheme(input),
  sizes: { ...defaultTheme.sizes, ...input?.sizes },
})
