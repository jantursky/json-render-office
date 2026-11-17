export interface Theme {
  colors: {
    background: string
    text: string
    muted: string
    accent: string
    /** Text on an accent background. */
    onAccent: string
    /** Fill of a table header row, and of shaded table rows. */
    tableHeader: string
    tableStripe: string
  }
  /** Series colors for charts, in order. */
  palette: string[]
  fonts: { heading: string; body: string }
  /** Points. */
  sizes: { title: number; coverTitle: number; subtitle: number; body: number }
}

export const defaultTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    text: '#101828',
    muted: '#4A5565',
    accent: '#E42B0C',
    onAccent: '#FFFFFF',
    tableHeader: '#101828',
    tableStripe: '#F5F5F5',
  },
  palette: ['#E42B0C', '#101828', '#8A8A8A', '#4A5565', '#D4D4D4', '#364153'],
  fonts: { heading: 'Calibri', body: 'Calibri' },
  sizes: { title: 30, coverTitle: 40, subtitle: 20, body: 18 },
}

export interface ThemeInput {
  colors?: Partial<Theme['colors']>
  fonts?: Partial<Theme['fonts']>
  sizes?: Partial<Theme['sizes']>
  palette?: string[]
}

export const resolveTheme = (input?: ThemeInput): Theme => ({
  colors: { ...defaultTheme.colors, ...input?.colors },
  fonts: { ...defaultTheme.fonts, ...input?.fonts },
  sizes: { ...defaultTheme.sizes, ...input?.sizes },
  palette: input?.palette ?? defaultTheme.palette,
})
