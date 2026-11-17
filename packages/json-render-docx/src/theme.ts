export interface Theme {
  colors: {
    text: string
    muted: string
    heading: string
    tableHeader: string
    onTableHeader: string
    tableStripe: string
    rule: string
  }
  fonts: { heading: string; body: string }
  /** Points. */
  sizes: { body: number; title: number; h1: number; h2: number; h3: number }
}

export const defaultTheme: Theme = {
  colors: {
    text: '#101828',
    muted: '#4A5565',
    heading: '#101828',
    tableHeader: '#101828',
    onTableHeader: '#FFFFFF',
    tableStripe: '#F5F5F5',
    rule: '#D4D4D4',
  },
  fonts: { heading: 'Calibri', body: 'Calibri' },
  sizes: { body: 11, title: 28, h1: 18, h2: 14, h3: 12 },
}

export interface ThemeInput {
  colors?: Partial<Theme['colors']>
  fonts?: Partial<Theme['fonts']>
  sizes?: Partial<Theme['sizes']>
}

export const resolveTheme = (input?: ThemeInput): Theme => ({
  colors: { ...defaultTheme.colors, ...input?.colors },
  fonts: { ...defaultTheme.fonts, ...input?.fonts },
  sizes: { ...defaultTheme.sizes, ...input?.sizes },
})
