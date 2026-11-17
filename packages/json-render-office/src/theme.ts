/** The look shared by every output: slides, pages and the web preview read the same tokens. */
export interface BaseTheme {
  colors: {
    background: string
    text: string
    muted: string
    heading: string
    accent: string
    /** Text on an accent background. */
    onAccent: string
    tableHeader: string
    /** Text on a table header. */
    onTableHeader: string
    tableStripe: string
    rule: string
  }
  fonts: { heading: string; body: string }
  /** Series colors for charts, in order. */
  palette: string[]
}

export interface BaseThemeInput {
  colors?: Partial<BaseTheme['colors']>
  fonts?: Partial<BaseTheme['fonts']>
  palette?: string[]
}

export const defaultBaseTheme: BaseTheme = {
  colors: {
    background: '#FFFFFF',
    text: '#101828',
    muted: '#4A5565',
    heading: '#101828',
    accent: '#E42B0C',
    onAccent: '#FFFFFF',
    tableHeader: '#101828',
    onTableHeader: '#FFFFFF',
    tableStripe: '#F5F5F5',
    rule: '#D4D4D4',
  },
  fonts: { heading: 'Calibri', body: 'Calibri' },
  palette: ['#E42B0C', '#101828', '#8A8A8A', '#4A5565', '#D4D4D4', '#364153'],
}

/** Merges a partial theme over the defaults. Used by every renderer, so one input themes them all. */
export const resolveBaseTheme = (input?: BaseThemeInput): BaseTheme => ({
  colors: { ...defaultBaseTheme.colors, ...input?.colors },
  fonts: { ...defaultBaseTheme.fonts, ...input?.fonts },
  palette: input?.palette ?? defaultBaseTheme.palette,
})
