/**
 * Reads the JSON Schema that `z.toJSONSchema()` emits for a component's props and turns each
 * property into something a table cell can show. Only the shapes the catalogs use are handled;
 * anything else throws, so a new kind of prop cannot silently go undocumented.
 */

/** Splits a `null` branch off a property: `anyOf: [X, { type: 'null' }]` and `type: [X, 'null']`. */
function splitNullable(schema) {
  if (Array.isArray(schema.anyOf)) {
    const rest = schema.anyOf.filter((s) => s.type !== 'null')
    const nullable = rest.length < schema.anyOf.length
    if (rest.length !== 1) throw new Error(`Unsupported anyOf: ${JSON.stringify(schema)}`)
    return { schema: { ...rest[0], description: schema.description ?? rest[0].description }, nullable }
  }
  if (Array.isArray(schema.type)) {
    const rest = schema.type.filter((t) => t !== 'null')
    if (rest.length !== 1) throw new Error(`Unsupported type list: ${JSON.stringify(schema)}`)
    return { schema: { ...schema, type: rest[0] }, nullable: rest.length < schema.type.length }
  }
  return { schema, nullable: false }
}

const range = (min, max, unit) => {
  if (min !== undefined && max !== undefined) return min === max ? `${min} ${unit}` : `${min} to ${max} ${unit}`
  if (max !== undefined) return `at most ${max} ${unit}`
  if (min !== undefined) return `at least ${min} ${unit}`
  return undefined
}

/** The TypeScript-like name of a schema, for the Type column. */
export function typeName(schema) {
  const { schema: s } = splitNullable(schema)
  if (s.enum) return 'enum'
  switch (s.type) {
    case 'string':
    case 'number':
    case 'boolean':
      return s.type
    case 'integer':
      return 'integer'
    case 'array': {
      return `${typeName(s.items)}[]`
    }
    case 'object': {
      const fields = Object.entries(s.properties ?? {}).map(([key, value]) => `${key}: ${typeName(value)}`)
      return `{ ${fields.join('; ')} }`
    }
    default:
      throw new Error(`Unsupported schema: ${JSON.stringify(schema)}`)
  }
}

/** The limits of a schema as short phrases, such as "up to 90 characters" or "1 to 7 items". */
export function limits(schema) {
  const { schema: s } = splitNullable(schema)
  const notes = []
  if (s.type === 'string') {
    const text = range(s.minLength, s.maxLength, 'characters')
    if (text) notes.push(text)
  }
  if (s.type === 'number' || s.type === 'integer') {
    const min = s.minimum
    const max = s.maximum
    if (min !== undefined && max !== undefined) notes.push(`${min} to ${max}`)
    else if (max !== undefined) notes.push(`at most ${max}`)
    else if (min !== undefined) notes.push(`at least ${min}`)
  }
  if (s.type === 'array') {
    const count = range(s.minItems, s.maxItems, 'items')
    if (count) notes.push(count)
    const inner = limits(s.items)
    if (inner.length > 0) notes.push(`each ${inner.join(', ')}`)
  }
  return notes
}

/** One row per property: its name, type, whether it may be null, and the text for the last column. */
export function describeProps(jsonSchema) {
  return Object.entries(jsonSchema.properties ?? {}).map(([name, property]) => {
    const { schema, nullable } = splitNullable(property)
    const description = property.description ?? schema.description
    const notes = [...(schema.enum ? [`One of ${schema.enum.map((v) => `\`${v}\``).join(', ')}.`] : [])]
    const constraint = limits(schema)
    if (constraint.length > 0) notes.push(`${constraint.join(', ')}.`.replace(/^./, (c) => c.toUpperCase()))
    return { name, type: typeName(property), nullable, text: [description, ...notes].filter(Boolean).join(' ') }
  })
}
