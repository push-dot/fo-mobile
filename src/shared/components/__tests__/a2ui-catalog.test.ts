import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../../../../modules/push-a2ui/', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
type Schema = { type?: string; items?: { type?: string }; anyOf?: (Schema & { properties?: Record<string, unknown> })[] }
type Component = { properties: Record<string, Schema>; required?: string[] }
const catalog = JSON.parse(read('catalog/push-catalog.json')) as { components: Record<string, Component> }
const kotlin = read('android/src/main/java/expo/modules/pusha2ui/PushCatalog.kt')
const PUSH = ['PushChoice', 'PushTodo', 'PushDiff', 'PushPlan', 'PushFit', 'PushDocument', 'PushJobCard']
const COMMON = new Set(['id', 'component', 'weight'])

const factoryFor = (schema: Schema) => {
  const literal = schema.anyOf?.find((o) => !o.properties?.path)
  if (literal) return literal.type === 'boolean' ? 'dynamicBoolean' : literal.type === 'array' && literal.items?.type === 'string' ? 'dynamicStringList' : 'dynamicValue'
  if (schema.type === 'array') return schema.items?.type === 'string' ? 'stringList' : 'anyList'
  return schema.type === 'object' ? 'any' : schema.type
}

const declared = (name: string) => {
  const block = kotlin.slice(kotlin.indexOf(`object ${name} : A2uiComponent`))
  const listed = /override val properties = listOf\(([^)]*)\)/.exec(block)!
  const decls = [...block.slice(0, listed.index).matchAll(/private val (\w+) = A2uiProperty\.(\w+)\(key = "(\w+)"(, required = true)?\)/g)]
  return {
    props: new Map(decls.map(([, val, factory, key, required]) => [key!, { val: val!, factory: factory!, required: !!required }])),
    listed: listed[1]!.split(',').map((v) => v.trim()),
  }
}

describe('Push catalog', () => {
  it('has the seven Push components in both catalog documents', () => {
    const v1 = JSON.parse(read('catalog/push-catalog.v1.json')) as typeof catalog
    for (const name of PUSH) {
      expect(catalog.components[name], name).toBeDefined()
      expect(v1.components[name], name).toBeDefined()
    }
  })

  it.each(PUSH)('declares exactly the props of %s on Android, with their types, and lists each one', (name) => {
    const component = catalog.components[name]!
    const { props, listed } = declared(name)
    const keys = Object.keys(component.properties).filter((k) => !COMMON.has(k))
    expect([...props.keys()].sort()).toEqual([...keys].sort())
    for (const key of keys) {
      const prop = props.get(key)!
      expect(prop.factory, `${name}.${key}`).toBe(factoryFor(component.properties[key]!))
      expect(prop.required, `${name}.${key} required`).toBe(component.required?.includes(key) ?? false)
    }
    expect([...listed].sort()).toEqual([...props.values()].map((p) => p.val).sort())
  })
})
