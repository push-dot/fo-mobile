import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The vendored Push catalog drives the iOS components directly; Android declares the props in Kotlin. Every prop of
// the v0.9.1 catalog (the one Android speaks) must be declared there, so a catalog change cannot slip past it.
const root = new URL('../../../../modules/push-a2ui/', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const catalog = JSON.parse(read('catalog/push-catalog.json')) as { components: Record<string, { properties: Record<string, unknown> }> }
const kotlin = read('android/src/main/java/expo/modules/pusha2ui/PushCatalog.kt')
const PUSH = ['PushChoice', 'PushTodo', 'PushDiff', 'PushPlan', 'PushFit', 'PushDocument', 'PushJobCard']
// Every component has these; the renderer handles them itself.
const COMMON = new Set(['id', 'component', 'weight'])

describe('Push catalog', () => {
  it('has the seven Push components in both catalog documents', () => {
    const v1 = JSON.parse(read('catalog/push-catalog.v1.json')) as typeof catalog
    for (const name of PUSH) {
      expect(catalog.components[name], name).toBeDefined()
      expect(v1.components[name], name).toBeDefined()
    }
  })

  it.each(PUSH)('declares every prop of %s on Android', (name) => {
    const block = kotlin.slice(kotlin.indexOf(`object ${name} : A2uiComponent`))
    const body = block.slice(0, block.indexOf('override val properties'))
    for (const key of Object.keys(catalog.components[name]!.properties).filter((k) => !COMMON.has(k))) {
      expect(body, `${name}.${key}`).toContain(`key = "${key}"`)
    }
  })
})
