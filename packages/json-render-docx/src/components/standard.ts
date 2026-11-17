import type { UIElement } from '@json-render/core'
import { defineComponent, h, inject, type Component, type PropType, type VNode } from 'vue'
import {
  Document as DocxDocument,
  Footer as DocxFooter,
  Header as DocxHeader,
  Image as DocxImage,
  List,
  ListItem,
  PageBreak as DocxPageBreak,
  PageNumber,
  Paragraph,
  Section as DocxSection,
  Table as DocxTable,
  TableCell,
  TableOfContents as DocxToc,
  TableRow,
} from 'vue-docx-document'

import type { z } from 'zod'

import type { StandardComponentDefinitions } from '../catalog'
import { defaultTheme, type Theme } from '../theme'
import { IMAGES, THEME } from './context'

type StandardProps = {
  [K in keyof StandardComponentDefinitions]: z.output<StandardComponentDefinitions[K]['props']>
}

const elementProp = { element: { type: Object as PropType<UIElement>, required: true as const } }

const optional = <T>(value: T | null | undefined): T | undefined => value ?? undefined

const POINTS_PER_INCH = 72

const defineStandard = <K extends keyof StandardProps>(
  name: K,
  render: (props: StandardProps[K], children: VNode[], theme: Theme) => VNode | VNode[] | null,
): Component =>
  defineComponent({
    name,
    props: elementProp,
    setup(props, { slots }) {
      const theme = inject(THEME, defaultTheme)
      return () => render(props.element.props as StandardProps[K], slots.default?.() ?? [], theme)
    },
  })

/** Only the elements of the given types: a Document holds Sections and nothing else. */
const only = (children: VNode[], allowed: ReadonlySet<string>): VNode[] =>
  children.filter((child) => allowed.has(typeOf(child)))

const typeOf = (child: VNode): string => (child.props as { element?: UIElement } | null)?.element?.type ?? ''

/** A Section holds blocks. A Document or Section inside it cannot sit there in a Word file. */
const withoutStructure = (children: VNode[]): VNode[] =>
  children.filter((child) => typeOf(child) !== 'Document' && typeOf(child) !== 'Section')

const Document = defineStandard('Document', (p, children, theme) =>
  h(
    DocxDocument,
    {
      title: optional(p.title),
      creator: optional(p.author),
      language: optional(p.language),
      font: theme.fonts.body,
      fontSize: theme.sizes.body,
      color: theme.colors.text,
      lineHeight: 1.3,
      spaceAfter: 8,
      headings: {
        title: { size: theme.sizes.title, font: theme.fonts.heading, color: theme.colors.heading, bold: true },
        1: { size: theme.sizes.h1, font: theme.fonts.heading, color: theme.colors.heading, bold: true },
        2: { size: theme.sizes.h2, font: theme.fonts.heading, color: theme.colors.heading, bold: true },
        3: { size: theme.sizes.h3, font: theme.fonts.heading, color: theme.colors.heading, bold: true },
      },
    },
    () => {
      const sections = only(children, new Set(['Section']))
      // Word needs one Section, also while a streamed spec has not produced one yet.
      return sections.length > 0 ? sections : h(DocxSection)
    },
  ),
)

const Section = defineStandard('Section', (p, children) =>
  h(
    DocxSection,
    {
      size: optional(p.size),
      orientation: optional(p.orientation),
      margin: (p.margin ?? 1) * POINTS_PER_INCH,
    },
    () => withoutStructure(children),
  ),
)

const Header = defineStandard('Header', (p, _children, theme) =>
  h(DocxHeader, null, () =>
    h(Paragraph, { align: p.align ?? 'right', size: 9, color: theme.colors.muted }, () => p.text),
  ),
)

const Footer = defineStandard('Footer', (p, _children, theme) =>
  h(DocxFooter, null, () =>
    h(Paragraph, { align: p.align ?? 'center', size: 9, color: theme.colors.muted }, () => [
      ...(p.text ? [p.text] : []),
      ...(p.pageNumbers
        ? [p.text ? '  ·  Page ' : 'Page ', h(PageNumber), ' of ', h(PageNumber, { type: 'total' })]
        : []),
    ]),
  ),
)

const Title = defineStandard('Title', (p) => h(Paragraph, { heading: 'title', align: optional(p.align) }, () => p.text))

const Heading = defineStandard('Heading', (p) => h(Paragraph, { heading: p.level as 1 | 2 | 3 }, () => p.text))

const TextParagraph = defineStandard('Paragraph', (p) =>
  h(
    Paragraph,
    {
      align: optional(p.align),
      bold: optional(p.bold),
      italic: optional(p.italic),
      color: optional(p.color),
      size: optional(p.fontSize),
    },
    () => p.text,
  ),
)

const ListComponent = defineStandard('List', (p) =>
  h(List, { ordered: p.ordered ?? false }, () => p.items.map((item) => h(ListItem, null, () => item))),
)

const Table = defineStandard('Table', (p, _children, theme) => {
  const columns = p.columns.length
  return h(
    DocxTable,
    {
      cellPadding: 6,
      borders: {
        top: { color: theme.colors.rule },
        bottom: { color: theme.colors.rule },
        insideH: { color: theme.colors.rule },
        left: { style: 'none' },
        right: { style: 'none' },
        insideV: { style: 'none' },
      },
    },
    () => [
      h(
        TableRow,
        { header: true, bold: true, color: theme.colors.onTableHeader, background: theme.colors.tableHeader },
        () => p.columns.map((column) => h(TableCell, null, () => column)),
      ),
      ...p.rows.map((row, index) =>
        h(
          TableRow,
          { cantSplit: true, background: p.striped && index % 2 === 1 ? theme.colors.tableStripe : undefined },
          () => Array.from({ length: columns }, (_, column) => h(TableCell, null, () => row[column] ?? '')),
        ),
      ),
    ],
  )
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
        ? h(DocxImage, { src: data, alt: p.alt, width: (p.width ?? 5) * POINTS_PER_INCH, align: 'center' })
        : null
    }
  },
})

const PageBreak = defineStandard('PageBreak', () => h(DocxPageBreak))

const TableOfContents = defineStandard('TableOfContents', (p) =>
  h(DocxToc, { title: optional(p.title), levels: [1, p.maxLevel ?? 3] }),
)

export const standardComponents: Record<string, Component> = {
  Document,
  Section,
  Header,
  Footer,
  Title,
  Heading,
  Paragraph: TextParagraph,
  List: ListComponent,
  Table,
  Image: ImageComponent,
  PageBreak,
  TableOfContents,
}
