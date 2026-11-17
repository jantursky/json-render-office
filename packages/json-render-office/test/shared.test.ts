import { defineCatalog } from '@json-render/core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { COMMON_RULES, defaultBaseTheme, defineOfficeSchema, resolveBaseTheme, validateProps } from '../src/server'

describe('resolveBaseTheme', () => {
  it('returns the defaults without input', () => {
    expect(resolveBaseTheme()).toEqual(defaultBaseTheme)
  })

  it('merges colors and fonts over the defaults and replaces the palette', () => {
    const theme = resolveBaseTheme({ colors: { accent: '#00FF00' }, fonts: { body: 'Georgia' }, palette: ['#111111'] })
    expect(theme.colors.accent).toBe('#00FF00')
    expect(theme.colors.text).toBe(defaultBaseTheme.colors.text)
    expect(theme.fonts).toEqual({ heading: defaultBaseTheme.fonts.heading, body: 'Georgia' })
    expect(theme.palette).toEqual(['#111111'])
  })
})

describe('defineOfficeSchema', () => {
  const schema = defineOfficeSchema(['The root MUST be a Box.', ...COMMON_RULES])
  const catalog = defineCatalog(schema, {
    components: {
      Box: { props: z.object({ text: z.string() }), slots: [], description: 'A box.', example: { text: 'x' } },
    },
  })

  it('puts the rules into the prompt', () => {
    expect(catalog.prompt()).toContain('The root MUST be a Box.')
    expect(catalog.prompt()).toContain('CRITICAL INTEGRITY CHECK')
  })

  it('accepts the flat spec shape', () => {
    expect(
      catalog.validate({ root: 'a', elements: { a: { type: 'Box', props: { text: 'x' }, children: [] } } }).success,
    ).toBe(true)
  })
})

describe('validateProps', () => {
  const definitions = { Box: { props: z.object({ text: z.string().max(3) }) } }

  it('reports the elements whose props break their schema', () => {
    const issues = validateProps(
      {
        root: 'a',
        elements: {
          a: { type: 'Box', props: { text: 'too long' }, children: [] },
          b: { type: 'Box', props: { text: 'ok' }, children: [] },
          c: { type: 'Custom', props: {}, children: [] },
        },
      },
      definitions,
    )
    expect(issues).toEqual([expect.objectContaining({ element: 'a', type: 'Box' })])
  })
})
