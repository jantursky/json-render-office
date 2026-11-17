import type { UIElement } from '@json-render/core'
import { defineComponent, h, inject, provide, type Component, type PropType, type VNode } from 'vue'
import {
  Chart as PptxChart,
  Image as PptxImage,
  Paragraph,
  Presentation,
  Slide as PptxSlide,
  Table as PptxTable,
  Text as PptxText,
} from 'vue-pptx-document'

import type { StandardComponentDefinitions, StandardComponentProps } from '../catalog'
import { defaultTheme, type Theme } from '../theme'
import { IMAGES, SLIDE_LAYOUT, THEME, type SlideLayout } from './context'

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
  [K in keyof StandardComponentDefinitions]: StandardComponentProps<K>
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

const Table = defineStandard('Table', (p, _children, { theme }) => {
  const columns = p.columns.length
  const header = p.columns.map((text) => ({
    text,
    options: { bold: true, color: theme.colors.onAccent, fill: { color: theme.colors.tableHeader } },
  }))
  const body = p.rows.map((row, index) =>
    Array.from({ length: columns }, (_, column) => ({
      text: row[column] ?? '',
      options: p.striped && index % 2 === 1 ? { fill: { color: theme.colors.tableStripe } } : {},
    })),
  )
  return h(PptxTable, {
    rows: [header, ...body],
    headerRows: 1,
    fontFace: theme.fonts.body,
    fontSize: p.fontSize ?? 14,
    color: theme.colors.text,
    valign: 'middle',
    border: { type: 'solid', pt: 0.5, color: 'D4D4D4' },
    margin: 0.08,
    style: { flexShrink: 0 },
  })
})

const Chart = defineStandard('Chart', (p, _children, { theme }) => {
  const single = p.type === 'pie' || p.type === 'doughnut'
  return h(PptxChart, {
    type: p.type,
    data: (single ? p.series.slice(0, 1) : p.series).map((s) => ({ name: s.name, labels: p.labels, values: s.values })),
    chartColors: theme.palette,
    showLegend: p.legend ?? (single || p.series.length > 1),
    legendPos: 'b',
    legendFontFace: theme.fonts.body,
    showTitle: p.title !== null,
    title: optional(p.title),
    titleFontFace: theme.fonts.heading,
    titleFontSize: 16,
    catAxisLabelFontFace: theme.fonts.body,
    valAxisLabelFontFace: theme.fonts.body,
    altText: p.title ?? `${p.type} chart`,
    style: { flexGrow: 1 },
  })
})

const ImageComponent = defineComponent({
  name: 'Image',
  props: elementProp,
  setup(props) {
    const images = inject(IMAGES, new Map<string, string>())
    return () => {
      const p = props.element.props as StandardProps['Image']
      const data = images.get(p.src)
      return data
        ? h(PptxImage, {
            src: data,
            altText: p.alt,
            sizing: { type: 'contain', w: '100%', h: '100%' },
            style: { flexGrow: 1 },
          })
        : null
    }
  },
})

export const standardComponents: Record<string, Component> = {
  Deck,
  Slide: SlideComponent,
  Title,
  Subtitle,
  Text,
  BulletList,
  Table,
  Chart,
  Image: ImageComponent,
}
