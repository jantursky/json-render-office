import { defineCatalog } from '@json-render/core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { schema, standardComponentDefinitions } from '../src/server'
import { validateProps } from '../src/validate'
import { docSpec } from './helpers'

const catalog = defineCatalog(schema, { components: standardComponentDefinitions })

describe('catalog', () => {
  it('validates the fixture spec', () => {
    expect(catalog.validate(docSpec()).success).toBe(true)
    expect(validateProps(docSpec())).toEqual([])
  })

  it('rejects a heading level outside 1 to 3', () => {
    const spec = docSpec()
    spec.elements.h1!.props = { text: 'x', level: 7 }
    expect(validateProps(spec)).toEqual([expect.objectContaining({ element: 'h1', type: 'Heading' })])
  })

  it('turns every component definition into a JSON Schema', () => {
    for (const [name, definition] of Object.entries(standardComponentDefinitions)) {
      expect(z.toJSONSchema(definition.props).type, name).toBe('object')
    }
  })

  it('builds a prompt that names every component', () => {
    const prompt = catalog.prompt()
    for (const name of Object.keys(standardComponentDefinitions)) expect(prompt).toContain(name)
  })
})
