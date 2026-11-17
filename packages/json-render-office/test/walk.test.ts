import type { Spec } from '@json-render/core'
import { defineComponent, type VNode } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { consoleWarn, walkSpec, type RenderWarning } from '../src'

const Box = defineComponent({ props: { element: { type: Object, required: true } }, render: () => null })

const run = (spec: Spec, state: Record<string, unknown> = {}) => {
  const warnings: RenderWarning[] = []
  const nodes = walkSpec(spec, { registry: { Box }, state: { ...spec.state, ...state }, warn: (w) => warnings.push(w) })
  return { nodes, warnings }
}

const propsOf = (node: VNode): Record<string, unknown> =>
  (node.props as { element: { props: Record<string, unknown> } }).element.props

describe('walkSpec', () => {
  it('returns nothing and warns when the root is missing', () => {
    expect(run({ root: 'a', elements: {} }).warnings.map((w) => w.code)).toEqual(['missing-root'])
    expect(run({ root: '', elements: {} }).nodes).toEqual([])
  })

  it('skips children that are not there yet', () => {
    const { nodes, warnings } = run({
      root: 'a',
      elements: { a: { type: 'Box', props: {}, children: ['gone'] } },
    })
    expect(nodes).toHaveLength(1)
    expect(warnings).toEqual([expect.objectContaining({ code: 'missing-element', element: 'gone' })])
  })

  it('skips unknown types', () => {
    const { nodes, warnings } = run({ root: 'a', elements: { a: { type: 'Nope', props: {}, children: [] } } })
    expect(nodes).toEqual([])
    expect(warnings[0]?.code).toBe('unknown-type')
  })

  it('resolves $state expressions in props', () => {
    const { nodes } = run({
      root: 'a',
      state: { name: 'Ada' },
      elements: { a: { type: 'Box', props: { text: { $state: '/name' } }, children: [] } },
    })
    expect(propsOf(nodes[0]!)).toEqual({ text: 'Ada' })
  })

  it('drops elements whose visible condition is false', () => {
    const { nodes } = run({
      root: 'a',
      state: { show: false },
      elements: { a: { type: 'Box', props: {}, children: [], visible: { $state: '/show' } } },
    })
    expect(nodes).toEqual([])
  })

  it('repeats the children of an element once per item', () => {
    const { nodes } = run({
      root: 'list',
      state: { rows: [{ n: 'a' }, { n: 'b' }, { n: 'c' }] },
      elements: {
        list: { type: 'Box', props: {}, children: ['row'], repeat: { statePath: '/rows' } },
        row: { type: 'Box', props: { text: { $item: 'n' } }, children: [] },
      },
    })
    const children = (nodes[0]!.children as { default: () => VNode[] }).default()
    expect(children.map((c) => propsOf(c).text)).toEqual(['a', 'b', 'c'])
  })

  it('warns about a repeat that reads $item outside a repeat', () => {
    const { warnings } = run({
      root: 'list',
      elements: {
        list: { type: 'Box', props: {}, children: ['x'], repeat: { statePath: { $item: 'rows' } } },
        x: { type: 'Box', props: {}, children: [] },
      },
    })
    expect(warnings.map((w) => w.code)).toContain('bad-repeat')
  })
})

describe('consoleWarn', () => {
  it('prefixes the message with the package tag', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleWarn('json-render-x')({ code: 'unknown-type', message: 'No component.' })
    expect(spy).toHaveBeenCalledWith('[json-render-x] No component.')
    spy.mockRestore()
  })
})

describe('a spec that has not started streaming', () => {
  it('walks `{}` without throwing', () => {
    const warnings: RenderWarning[] = []
    expect(walkSpec({}, { registry: { Box }, state: {}, warn: (w) => warnings.push(w) })).toEqual([])
    expect(warnings.map((w) => w.code)).toEqual(['missing-root'])
  })
  it('stops a cycle with a warning', () => {
    const { warnings } = run({ root: 'a', elements: { a: { type: 'Box', props: {}, children: ['a'] } } })
    expect(warnings.map((w) => w.code)).toEqual(['cycle'])
  })

  it('warns when a repeat path is not a list', () => {
    const spec: Spec = {
      root: 'a',
      elements: {
        a: { type: 'Box', props: {}, children: ['b'], repeat: { statePath: '/x' } },
        b: { type: 'Box', props: {} },
      },
    }
    expect(run(spec, { x: 'abc' }).warnings.map((w) => w.code)).toEqual(['bad-repeat'])
    expect(run(spec, { x: { a: 1 } }).warnings.map((w) => w.code)).toEqual(['bad-repeat'])
  })

  it('does not take types or roots from Object.prototype', () => {
    expect(run({ root: 'toString', elements: {} }).warnings.map((w) => w.code)).toEqual(['missing-root'])
    const spec: Spec = { root: 'a', elements: { a: { type: 'toString', props: {} } } }
    expect(run(spec).warnings.map((w) => w.code)).toEqual(['unknown-type'])
  })

  it('skips an element whose props fail its definition', () => {
    const warnings: RenderWarning[] = []
    const props = { safeParse: (v: unknown) => ({ success: Array.isArray((v as { items?: unknown }).items) }) }
    const nodes = walkSpec(
      { root: 'a', elements: { a: { type: 'Box', props: {} } } },
      { registry: { Box }, state: {}, warn: (w) => warnings.push(w), definitions: { Box: { props } } },
    )
    expect(nodes).toEqual([])
    expect(warnings.map((w) => w.code)).toEqual(['bad-props'])
  })
})
