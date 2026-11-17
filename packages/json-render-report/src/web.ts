import type { UIElement } from '@json-render/core'
import { classifySource, resolveBaseTheme, type BaseThemeInput } from 'json-render-office'
import { defineComponent, h, type CSSProperties, type Component, type PropType, type VNode } from 'vue'

import { CHART_HEIGHT, CHART_WIDTH, layoutChart, type Shape } from './chart'
import type { ReportProps } from './element'

/** The theme as CSS custom properties, so the page follows the same tokens as the deck and the document. */
export function themeStyle(input?: BaseThemeInput): CSSProperties {
  const theme = resolveBaseTheme(input)
  const style: Record<string, string> = {
    '--jr-background': theme.colors.background,
    '--jr-text': theme.colors.text,
    '--jr-muted': theme.colors.muted,
    '--jr-heading': theme.colors.heading,
    '--jr-accent': theme.colors.accent,
    '--jr-table-header': theme.colors.tableHeader,
    '--jr-on-table-header': theme.colors.onTableHeader,
    '--jr-table-stripe': theme.colors.tableStripe,
    '--jr-rule': theme.colors.rule,
    '--jr-font-heading': `${theme.fonts.heading}, system-ui, sans-serif`,
    '--jr-font-body': `${theme.fonts.body}, system-ui, sans-serif`,
  }
  for (let index = 0; index < SERIES_SLOTS; index++) {
    style[`--jr-series-${index}`] = theme.palette[index % theme.palette.length] ?? ''
  }
  return style
}

const SERIES = (index: number): string => `var(--jr-series-${index % SERIES_SLOTS})`

/** Series colours are defined for this many slots, cycling a shorter palette. */
const SERIES_SLOTS = 12

/** The preview loads only what the Office renderers load: https URLs and data: images. */
const webImageSrc = (src: string): string | undefined => (classifySource(src) === 'blocked' ? undefined : src)

const elementProp = { element: { type: Object as PropType<UIElement>, required: true as const } }

const define = <K extends keyof ReportProps>(
  name: K,
  render: (props: ReportProps[K], children: VNode[]) => VNode | VNode[] | null,
): Component =>
  defineComponent({
    name: `Web${name}`,
    inheritAttrs: false,
    props: elementProp,
    setup(props, { slots }) {
      return () => render(props.element.props as ReportProps[K], slots.default?.() ?? [])
    },
  })

const shapeNode = (shape: Shape, index: number): VNode => {
  switch (shape.kind) {
    case 'rect':
      return h('rect', {
        key: index,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        fill: SERIES(shape.series),
      })
    case 'path':
      return h('path', {
        key: index,
        d: shape.d,
        fill: shape.fill ? SERIES(shape.series) : 'none',
        'fill-opacity': shape.fill ? 0.35 : undefined,
        stroke: SERIES(shape.series),
        'stroke-width': 2,
      })
    case 'slice':
      return h('path', {
        key: index,
        d: shape.d,
        fill: SERIES(shape.series),
        stroke: 'var(--jr-background)',
        'stroke-width': 1,
      })
    case 'label':
      return h(
        'text',
        { key: index, x: shape.x, y: shape.y, 'text-anchor': shape.anchor, 'font-size': 10, fill: 'var(--jr-muted)' },
        shape.text,
      )
  }
}

/** The report as a web page: plain HTML and SVG, themed through CSS custom properties. */
export const webRegistry: Record<string, Component> = {
  Report: define('Report', (p, children) =>
    h('article', { class: 'jr-report' }, [
      h('header', { class: 'jr-cover' }, [
        h('h1', p.title),
        ...(p.subtitle ? [h('p', { class: 'jr-subtitle' }, p.subtitle)] : []),
        ...(p.author ? [h('p', { class: 'jr-author' }, p.author)] : []),
      ]),
      ...children,
    ]),
  ),
  Chapter: define('Chapter', (p, children) => h('section', { class: 'jr-chapter' }, [h('h2', p.title), ...children])),
  Paragraph: define('Paragraph', (p) => h('p', p.text)),
  BulletList: define('BulletList', (p) =>
    h(
      p.ordered ? 'ol' : 'ul',
      p.items.map((item, i) => h('li', { key: i }, item)),
    ),
  ),
  Table: define('Table', (p) =>
    h('table', { class: p.striped ? 'jr-striped' : undefined }, [
      h(
        'thead',
        h(
          'tr',
          p.columns.map((c, i) => h('th', { key: i }, c)),
        ),
      ),
      h(
        'tbody',
        p.rows.map((row, r) =>
          h(
            'tr',
            { key: r },
            p.columns.map((_, c) => h('td', { key: c }, row[c] ?? '')),
          ),
        ),
      ),
    ]),
  ),
  Chart: define('Chart', (p) => {
    const single = p.type === 'pie' || p.type === 'doughnut'
    const names = single ? p.labels : p.series.map((s) => s.name)
    return h('figure', { class: 'jr-chart' }, [
      ...(p.title ? [h('figcaption', p.title)] : []),
      h(
        'svg',
        { viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`, role: 'img', 'aria-label': p.title ?? `${p.type} chart` },
        layoutChart(p).map(shapeNode),
      ),
      h(
        'ul',
        { class: 'jr-legend' },
        names.map((name, i) => h('li', { key: i }, [h('i', { style: { background: SERIES(i) } }), name])),
      ),
    ])
  }),
  Image: define('Image', (p) => h('img', { src: webImageSrc(p.src), alt: p.alt, loading: 'lazy' })),
}

/** Base styles for `webRegistry`. Optional: every class is prefixed `jr-`. */
export const webStyles = `
.jr-report{font-family:var(--jr-font-body);color:var(--jr-text);background:var(--jr-background);line-height:1.5;max-width:46rem;margin:0 auto;padding:2rem}
.jr-report h1,.jr-report h2{font-family:var(--jr-font-heading);color:var(--jr-heading);line-height:1.2}
.jr-cover{margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--jr-rule)}
.jr-subtitle{font-size:1.15rem;color:var(--jr-muted)}
.jr-author{color:var(--jr-muted)}
.jr-chapter{margin-bottom:2rem}
.jr-report table{width:100%;border-collapse:collapse;font-size:.9rem}
.jr-report th{background:var(--jr-table-header);color:var(--jr-on-table-header);text-align:left}
.jr-report th,.jr-report td{padding:.4rem .6rem;border-bottom:1px solid var(--jr-rule)}
.jr-striped tbody tr:nth-child(even){background:var(--jr-table-stripe)}
.jr-report img{max-width:100%;height:auto}
.jr-chart svg{width:100%;height:auto}
.jr-chart figcaption{font-weight:600;margin-bottom:.25rem}
.jr-legend{display:flex;flex-wrap:wrap;gap:.25rem 1rem;list-style:none;padding:0;font-size:.85rem;color:var(--jr-muted)}
.jr-legend i{display:inline-block;width:.7rem;height:.7rem;margin-right:.35rem;border-radius:2px}
`
