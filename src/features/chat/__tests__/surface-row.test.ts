import { describe, expect, it, vi } from 'vitest'
import { findAll } from '@/shared/components/__tests__/native-stubs'

const waiting = vi.hoisted(() => ({ id: 'newest' as string | null }))
vi.mock('@/shared/components', () => ({ A2uiSurface: 'A2uiSurface' }))
vi.mock('../components/motion', () => ({ default: 'Appear' }))
vi.mock('../hooks', () => ({ useChatWaiting: () => waiting.id }))
vi.mock('../stores', () => ({ answerSurface: vi.fn() }))

const { default: SurfaceRow } = await import('../components/entries/surface-row')

const row = (id: string) => {
  const tree = SurfaceRow({ chatId: 'c1', item: { type: 'surface', id, kind: 'approval', messages: [] } })
  return findAll(tree, 'A2uiSurface')[0]!.props
}

describe('SurfaceRow', () => {
  it('lets only the surface the run waits on answer', () => {
    expect(row('newest').interactive).toBe(true)
    expect(row('older').interactive).toBe(false)
  })

  it('lets no surface answer while the run waits on none', () => {
    waiting.id = null
    expect(row('newest').interactive).toBe(false)
  })
})
