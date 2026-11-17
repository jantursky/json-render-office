import { describe, expect, it } from 'vitest'

import { layoutChart, niceMax, type ChartData } from '../src/chart'

const data = (type: ChartData['type']): ChartData => ({
  type,
  labels: ['A', 'B', 'C'],
  series: [
    { name: 'One', values: [1, 2, 3] },
    { name: 'Two', values: [3, 2, 1] },
  ],
})

describe('niceMax', () => {
  it.each([
    [0, 1],
    [0.7, 1],
    [1.4, 2],
    [3.2, 5],
    [7, 10],
    [42, 50],
  ])('%s rounds up to %s', (value, max) => {
    expect(niceMax(value)).toBe(max)
  })
})

describe('layoutChart', () => {
  it('draws one bar per value, side by side', () => {
    const rects = layoutChart(data('bar')).filter((s) => s.kind === 'rect')
    expect(rects).toHaveLength(6)
  })

  it('draws one line per series, and closes an area', () => {
    expect(layoutChart(data('line')).filter((s) => s.kind === 'path')).toHaveLength(2)
    const areas = layoutChart(data('area')).filter((s) => s.kind === 'path')
    expect(areas.every((s) => s.fill && s.d.endsWith('Z'))).toBe(true)
  })

  it('draws one slice per value of the first series', () => {
    expect(layoutChart(data('pie')).filter((s) => s.kind === 'slice')).toHaveLength(3)
    expect(layoutChart(data('doughnut')).filter((s) => s.kind === 'slice')).toHaveLength(3)
  })

  it('labels the axes', () => {
    const labels = layoutChart(data('bar')).filter((s) => s.kind === 'label')
    expect(labels.length).toBe(5 + 3)
  })

  it('survives empty series', () => {
    expect(() => layoutChart({ type: 'line', labels: [], series: [{ name: 'x', values: [] }] })).not.toThrow()
    expect(() => layoutChart({ type: 'pie', labels: [], series: [] })).not.toThrow()
  })
})
