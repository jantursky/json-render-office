import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const KEY = 'report-generator-theme'
const dark = () => window.matchMedia('(prefers-color-scheme: dark)')

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function persist(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Private windows can refuse storage; the choice then lasts for this visit only.
  }
}

/** The page theme: the saved choice, else the system setting. Only an explicit choice sets `data-theme`. */
export function useTheme() {
  const saved = stored()
  const theme = ref<Theme>(saved ?? (dark().matches ? 'dark' : 'light'))
  if (saved) document.documentElement.dataset.theme = saved

  const toggle = (): void => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    persist(theme.value)
  }
  return { theme, toggle }
}
