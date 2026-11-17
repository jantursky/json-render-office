import type { InjectionKey } from 'vue'

import type { Theme } from '../theme'

export const THEME: InjectionKey<Theme> = Symbol('json-render-docx:theme')
/** Images already loaded, by the source the spec gave. */
export const IMAGES: InjectionKey<ReadonlyMap<string, string>> = Symbol('json-render-docx:images')
