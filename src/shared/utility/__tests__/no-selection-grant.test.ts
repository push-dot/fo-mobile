import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { noSelectionGrant, stopSelectionGrant } from '../no-selection-grant'

describe('noSelectionGrant', () => {
  it('stops the capture pass and grants nothing, so a TextInput never takes the responder on a selection change', () => {
    const stopPropagation = vi.fn()
    expect(stopSelectionGrant({ stopPropagation })).toBe(false)
    expect(stopPropagation).toHaveBeenCalledOnce()
    expect(Object.keys(noSelectionGrant)).toEqual(['onSelectionChangeShouldSetResponderCapture'])
  })

  it('is applied at the root layout, above every TextInput', () => {
    const root = readFileSync(join(__dirname, '../../../app/_layout.tsx'), 'utf8')
    expect(root).toMatch(/<View[^>]*\{\.\.\.noSelectionGrant\}/)
  })
})
