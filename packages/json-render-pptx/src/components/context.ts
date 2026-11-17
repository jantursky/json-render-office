import type { InjectionKey } from 'vue'

import type { SLIDE_LAYOUTS } from '../catalog'
import type { Theme } from '../theme'

export type SlideLayout = (typeof SLIDE_LAYOUTS)[number]

export const THEME: InjectionKey<Theme> = Symbol('json-render-pptx:theme')
export const SLIDE_LAYOUT: InjectionKey<SlideLayout> = Symbol('json-render-pptx:slide-layout')
