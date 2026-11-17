import type { UIElement } from '@json-render/core'
import { defineComponent, h, inject, provide, type Component, type PropType, type VNode } from 'vue'
import { Paragraph, Presentation, Slide as PptxSlide, Text as PptxText } from 'vue-pptx-document'

import type { StandardComponentProps } from '../catalog'
import { defaultTheme, type Theme } from '../theme'
import { SLIDE_LAYOUT, THEME, type SlideLayout } from './context'

type Align = 'left' | 'center' | 'right'

/** Props every registry component receives: the resolved element and its rendered children in the default slot. */
export interface ElementProps<K extends string = string, P = Record<string, unknown>> {
  element: UIElement<K, P>
}

const elementProp = { element: { type: Object as PropType<UIElement>, required: true as const } }

const optional = <T>(value: T | null | undefined): T | undefined => value ?? undefined

const useTheme = (): Theme => inject(THEME, defaultTheme)

const defineStandard = <K extends keyof StandardProps>(
  name: K,
  render: (props: StandardProps[K], children: VNode[], ctx: { theme: Theme; layout: SlideLayout }) => VNode | VNode[],
): Component =>
  defineComponent({
    name,
    props: elementProp,
    setup(props, { slots }) {
      const theme = useTheme()
      return () =>
        render(props.element.props as StandardProps[K], slots.default?.() ?? [], {
          theme,
          layout: inject(SLIDE_LAYOUT, 'title-content'),
        })
    },
  })

type StandardProps = {
  [K in 'Deck' | 'Slide' | 'Title' | 'Subtitle' | 'Text' | 'BulletList']: StandardComponentProps<K>
}

const Deck = defineStandard('Deck', (p, children) =>
  h(
    Presentation,
    { layout: '16x9', title: optional(p.title), author: optional(p.author), subject: optional(p.subject) },
    () => children,
  ),
)

const SlideComponent = defineComponent({
  name: 'Slide',
  props: elementProp,
  setup(props, { slots }) {
    const theme = useTheme()
    const p = props.element.props as StandardProps['Slide']
    const layout: SlideLayout = p.layout ?? 'title-content'
    provide(SLIDE_LAYOUT, layout)
    return () => {
      const onAccent = layout === 'section'
      return h(
        PptxSlide,
        {
          layout: 'flex',
          background: optional(p.background) ?? (onAccent ? theme.colors.accent : theme.colors.background),
          color: onAccent ? theme.colors.onAccent : theme.colors.text,
          notes: optional(p.notes),
          style: {
            padding: layout === 'blank' ? 0 : 0.6,
            gap: 0.25,
            justifyContent: layout === 'title' || layout === 'section' ? 'center' : 'flex-start',
          },
        },
        () => slots.default?.() ?? [],
      )
    }
  },
})

const heading = (p: { text: string; align: Align | null; color: string | null }, theme: Theme, layout: SlideLayout) => {
  const cover = layout === 'title' || layout === 'section'
  return h(
    PptxText,
    {
      fontFace: theme.fonts.heading,
      fontSize: cover ? theme.sizes.coverTitle : theme.sizes.title,
      bold: true,
      valign: 'top',
      align: p.align ?? (cover ? 'left' : undefined),
      color: optional(p.color),
    },
    () => p.text,
  )
}

const Title = defineStandard('Title', (p, _children, { theme, layout }) => heading(p, theme, layout))

const Subtitle = defineStandard('Subtitle', (p, _children, { theme, layout }) =>
  h(
    PptxText,
    {
      fontFace: theme.fonts.body,
      fontSize: theme.sizes.subtitle,
      valign: 'top',
      align: optional(p.align),
      color: optional(p.color) ?? (layout === 'section' ? theme.colors.onAccent : theme.colors.muted),
    },
    () => p.text,
  ),
)

const Text = defineStandard('Text', (p, _children, { theme }) =>
  h(
    PptxText,
    {
      fontFace: theme.fonts.body,
      fontSize: p.fontSize ?? theme.sizes.body,
      bold: optional(p.bold),
      italic: optional(p.italic),
      align: optional(p.align),
      color: optional(p.color),
      valign: 'top',
    },
    () => p.text,
  ),
)

const BulletList = defineStandard('BulletList', (p, _children, { theme }) =>
  h(
    PptxText,
    {
      fontFace: theme.fonts.body,
      fontSize: p.fontSize ?? theme.sizes.body,
      color: optional(p.color),
      valign: 'top',
      style: { flexGrow: 1 },
    },
    () =>
      p.items.map((item) =>
        h(Paragraph, { bullet: p.ordered ? { type: 'number' } : true, paraSpaceAfter: 8, indentLevel: 0 }, () => item),
      ),
  ),
)

export const standardComponents: Record<string, Component> = {
  Deck,
  Slide: SlideComponent,
  Title,
  Subtitle,
  Text,
  BulletList,
}
