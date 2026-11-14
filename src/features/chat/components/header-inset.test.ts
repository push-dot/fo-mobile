import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { headerInset } from './header-inset'

describe('headerInset', () => {
  it('pads a back-button header 12 on iOS and 8 on Android, a close-button sheet header 20', () => {
    expect(headerInset(true, true)).toBe(12)
    expect(headerInset(false, true)).toBe(8)
    expect(headerInset(true, false)).toBe(20)
    expect(headerInset(false, false)).toBe(20)
  })
})

describe('PageModal nav prop', () => {
  const read = (f: string) => readFileSync(path.join(import.meta.dirname, f), 'utf8')

  it('picks the nav inset from an explicit prop, not from `left` (usage keeps 20, ChatAccountUsage padding 20)', () => {
    expect(read('page-modal.tsx')).toContain('headerInset(ios, !!nav)')
    expect(read('page-modal.tsx')).not.toContain('left != null')
    expect(read('usage-page.tsx')).not.toMatch(/<PageModal[^>]*\bnav\b/)
  })

  it('marks only the plan pages (PlanUltra, PlanUltraNotice) as nav', () => {
    expect(read('plan-page.tsx').match(/\bnav\b\s*(?:\n|left=)/g)).toHaveLength(2)
  })
})
