export interface Theme {
  colors: {
    background: string
    text: string
    muted: string
    accent: string
    /** Text on an accent background. */
    onAccent: string
  }
  fonts: { heading: string; body: string }
  /** Points. */
  sizes: { title: number; coverTitle: number; subtitle: number; body: number }
}

export const defaultTheme: Theme = {
  colors: { background: '#FFFFFF', text: '#101828', muted: '#4A5565', accent: '#E42B0C', onAccent: '#FFFFFF' },
  fonts: { heading: 'Calibri', body: 'Calibri' },
  sizes: { title: 30, coverTitle: 40, subtitle: 20, body: 18 },
}

export type ThemeInput = { [K in keyof Theme]?: Partial<Theme[K]> }

export const resolveTheme = (input?: ThemeInput): Theme => ({
  colors: { ...defaultTheme.colors, ...input?.colors },
  fonts: { ...defaultTheme.fonts, ...input?.fonts },
  sizes: { ...defaultTheme.sizes, ...input?.sizes },
})
