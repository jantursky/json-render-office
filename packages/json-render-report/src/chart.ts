export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area'
  labels: string[]
  series: { name: string; values: number[] }[]
}

export type Shape =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; series: number }
  | { kind: 'path'; d: string; series: number; fill: boolean }
  | { kind: 'slice'; d: string; series: number }
  | { kind: 'label'; x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }

export const CHART_WIDTH = 480
export const CHART_HEIGHT = 260

const PLOT = { left: 40, right: 12, top: 12, bottom: 30 }

const round = (n: number): number => Math.round(n * 100) / 100

/** A "nice" top for the value axis, so the gridlines land on round numbers. */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / 10 ** exponent
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return step * 10 ** exponent
}

function slices(data: ChartData): Shape[] {
  const values = (data.series[0]?.values ?? []).map((v) => Math.max(0, v))
  const total = values.reduce((a, b) => a + b, 0) || 1
  const cx = CHART_WIDTH / 2
  const cy = CHART_HEIGHT / 2
  const r = CHART_HEIGHT / 2 - 14
  const inner = data.type === 'doughnut' ? r * 0.55 : 0
  let angle = -Math.PI / 2
  return values.map((value, index) => {
    const sweep = (value / total) * Math.PI * 2
    const end = angle + Math.min(sweep, Math.PI * 2 - 0.0001)
    const point = (radius: number, a: number): string =>
      `${round(cx + radius * Math.cos(a))} ${round(cy + radius * Math.sin(a))}`
    const large = sweep > Math.PI ? 1 : 0
    const d =
      inner > 0
        ? `M ${point(r, angle)} A ${r} ${r} 0 ${large} 1 ${point(r, end)} L ${point(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, angle)} Z`
        : `M ${cx} ${cy} L ${point(r, angle)} A ${r} ${r} 0 ${large} 1 ${point(r, end)} Z`
    angle += sweep
    return { kind: 'slice', d, series: index }
  })
}

/** Lays a chart out as plain shapes in a 480 x 260 box, so any renderer can draw it. */
export function layoutChart(data: ChartData): Shape[] {
  if (data.type === 'pie' || data.type === 'doughnut') return slices(data)

  const plotWidth = CHART_WIDTH - PLOT.left - PLOT.right
  const plotHeight = CHART_HEIGHT - PLOT.top - PLOT.bottom
  const max = niceMax(Math.max(0, ...data.series.flatMap((s) => s.values)))
  const y = (value: number): number => round(PLOT.top + plotHeight - (Math.max(0, value) / max) * plotHeight)
  const band = plotWidth / Math.max(1, data.labels.length)
  const shapes: Shape[] = []

  for (let i = 0; i <= 4; i++) {
    shapes.push({
      kind: 'label',
      x: PLOT.left - 6,
      y: y((max / 4) * i) + 4,
      text: String(round((max / 4) * i)),
      anchor: 'end',
    })
  }
  data.labels.forEach((text, i) => {
    shapes.push({ kind: 'label', x: round(PLOT.left + band * (i + 0.5)), y: CHART_HEIGHT - 10, text, anchor: 'middle' })
  })

  if (data.type === 'bar') {
    const count = data.series.length
    const width = (band * 0.7) / count
    data.series.forEach((s, series) =>
      s.values.forEach((value, i) => {
        const x = PLOT.left + band * i + band * 0.15 + width * series
        shapes.push({
          kind: 'rect',
          x: round(x),
          y: y(value),
          width: round(width),
          height: round(PLOT.top + plotHeight - y(value)),
          series,
        })
      }),
    )
    return shapes
  }

  data.series.forEach((s, series) => {
    const points = s.values.map((value, i) => `${round(PLOT.left + band * (i + 0.5))} ${y(value)}`)
    if (points.length === 0) return
    const line = `M ${points.join(' L ')}`
    const first = round(PLOT.left + band * 0.5)
    const last = round(PLOT.left + band * (s.values.length - 0.5))
    shapes.push({
      kind: 'path',
      d: data.type === 'area' ? `${line} L ${last} ${y(0)} L ${first} ${y(0)} Z` : line,
      series,
      fill: data.type === 'area',
    })
  })
  return shapes
}
