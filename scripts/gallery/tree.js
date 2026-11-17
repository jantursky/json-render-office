/**
 * A small way to write specs by hand: `node('Slide', { layout: 'title' }, child, child)`.
 * `builder` fills every prop the component defines but the call leaves out with null, as the
 * strict catalogs require, and `toSpec` flattens a tree into the `{ root, elements }` shape.
 */
export const builder =
  (definitions) =>
  (type, props = {}, ...children) => {
    const definition = definitions[type]
    if (!definition) throw new Error(`Unknown component "${type}".`)
    const nulls = Object.fromEntries(Object.keys(definition.props.shape).map((key) => [key, null]))
    return { type, props: { ...nulls, ...props }, children }
  }

export function toSpec(tree) {
  const elements = {}
  const counts = {}
  const add = (item) => {
    counts[item.type] = (counts[item.type] ?? 0) + 1
    const key = `${item.type.toLowerCase()}-${counts[item.type]}`
    elements[key] = { type: item.type, props: item.props, children: item.children.map(add) }
    return key
  }
  return { root: add(tree), elements }
}
