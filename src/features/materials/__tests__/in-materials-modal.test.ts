import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-router', () => ({ useNavigation: vi.fn() }))

import { inMaterialsModal } from '../components/in-materials-modal'

const stack = (names: string[]) => ({ index: names.length - 1, routes: names.map((name) => ({ name })) })

describe('inMaterialsModal', () => {
  it('is true for a page pushed over the 자료 list', () => {
    expect(inMaterialsModal(stack(['(tabs)', 'materials/index', 'materials/[kind]/[id]']))).toBe(true)
    expect(inMaterialsModal(stack(['(tabs)', 'materials/index', 'materials/[kind]/[id]', 'materials/pick']))).toBe(true)
  })

  it('is false for a page opened from a chat source, and for the list itself', () => {
    expect(inMaterialsModal(stack(['(tabs)', 'bots/[botId]/index', 'materials/[kind]/[id]']))).toBe(false)
    expect(inMaterialsModal(stack(['(tabs)', 'materials/index']))).toBe(false)
  })
})
