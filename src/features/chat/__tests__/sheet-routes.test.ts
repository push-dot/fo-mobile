import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { accountPath, bookmarksPath, consentPath, conversationsPath, docsPath, linkAddPath, linksPath, materialsPath, quickStartPath, renamePath, sidebarDepth, sidebarPath } from '../utils/sheet-routes'

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
    [materialsPath()],
    [accountPath()],
    [accountPath('plan')],
    [docsPath()],
    [linksPath()],
    [linkAddPath()],
    [bookmarksPath()],
    [conversationsPath()],
    [conversationsPath('c1')],
    [renamePath('c1'), 'id'],
  ]

  it.each(cases)('%s has a route file and a native presentation', (href, param) => {
    const route = routeOf(href, param)
    expect(existsSync(join(STACK, `${route}.tsx`))).toBe(true)
    expect(layout).toContain(`name="${route}"`)
  })

  it('opens the sidebar as a left-sliding stack route', () => {
    expect(existsSync(join(STACK, 'sidebar/index.tsx'))).toBe(true)
    expect(layout).toMatch(/name="sidebar\/index" options=\{\{ animation: 'slide_from_left' \}\}/)
    expect(sidebarPath('c1')).toContain('current=c1')
  })

  it.each([
    [['(tabs)', 'chat/[id]', 'sidebar/index', 'sidebar/docs'], 2],
    [['(tabs)', 'chat/[id]', 'sidebar/docs'], 1],
    [['(tabs)', 'sidebar/index', 'sidebar/bookmarks', 'sidebar/link-add'], 3],
    [['(tabs)', 'sidebar/index', 'postings/[id]'], 0],
  ])('counts the sidebar pages on top of %j as %i', (names, depth) => {
    expect(sidebarDepth(names)).toBe(depth)
  })

  it('keeps the query a page needs', () => {
    expect(accountPath('plan')).toContain('page=plan')
    expect(conversationsPath('c1')).toContain('current=c1')
  })
})
