import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { consentPath, materialPickerPath, quickStartPath } from '../utils/sheet-routes'

const STACK = join(__dirname, '../../../app/(app)/(stack)')
const layout = readFileSync(join(STACK, '_layout.tsx'), 'utf8')

const routeOf = (href: string, param?: string) => {
  const path = href.split('?')[0]!.slice(1)
  return param ? path.replace(/[^/]+$/, `[${param}]`) : path
}

describe('chat sheet routes', () => {
  const cases: [string, string?][] = [
    [consentPath()],
    [quickStartPath('link'), 'key'],
    [materialPickerPath()],
  ]

  it.each(cases)('%s has a route file and a native presentation', (href, param) => {
    const route = routeOf(href, param)
    expect(existsSync(join(STACK, `${route}.tsx`))).toBe(true)
    expect(layout).toContain(`name="${route}"`)
  })
})
