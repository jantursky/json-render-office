import { defineCatalog } from '@json-render/core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { schema, standardComponentDefinitions } from '../src/server'
import { validateProps } from '../src/validate'
import { deckSpec } from './helpers'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })

describe('catalog', () => {
  it('validates the fixture spec', () => {
    expect(catalog.validate(deckSpec()).success).toBe(true)
  })

  it('rejects a bullet list that is too long', () => {
    const spec = deckSpec()
    spec.elements.bullets = {
      type: 'BulletList',
      props: { items: Array.from({ length: 9 }, (_, i) => `item ${i}`), ordered: null, fontSize: null, color: null },
      children: [],
    }
    expect(validateProps(spec)).toEqual([expect.objectContaining({ element: 'bullets', type: 'BulletList' })])
  })

  it('accepts the fixture props', () => {
    expect(validateProps(deckSpec())).toEqual([])
  })

  it('turns every component definition into a JSON Schema', () => {
    for (const [name, definition] of Object.entries(standardComponentDefinitions)) {
      const json = z.toJSONSchema(definition.props)
      expect(json.type, name).toBe('object')
    }
  })

  it('builds a prompt that names every component', () => {
    const prompt = catalog.prompt()
    for (const name of Object.keys(standardComponentDefinitions)) expect(prompt).toContain(name)
  })
})
