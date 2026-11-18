import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Material } from '../types'

const h = vi.hoisted(() => ({ remove: vi.fn(), restore: vi.fn(), alert: vi.fn(), toast: vi.fn() }))
vi.mock('react-native', () => ({ Alert: { alert: h.alert } }))
vi.mock('@/shared/components', () => ({ showToast: h.toast }))
vi.mock('../api/hooks', () => ({ useDeleteMaterial: () => h.remove, useRestoreMaterial: () => h.restore }))

const { useConfirmDeleteMaterial } = await import('../components/confirm-delete-material')

const file = { kind: 'file', id: 'f1', title: '이력서.pdf' } as unknown as Material

describe('useConfirmDeleteMaterial', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks in a native alert and deletes only after the 삭제 button', async () => {
    h.remove.mockResolvedValue(undefined)
    useConfirmDeleteMaterial(0)(file)
    expect(h.remove).not.toHaveBeenCalled()
    const buttons = h.alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[]
    expect(buttons.map((b) => b.text)).toEqual(['취소', '삭제'])
    buttons[1]!.onPress!()
    await vi.waitFor(() => expect(h.toast).toHaveBeenCalled())
    expect(h.remove).toHaveBeenCalledWith('file', 'f1')
  })

  it('cancel deletes nothing', () => {
    useConfirmDeleteMaterial(0)(file)
    const buttons = h.alert.mock.calls[0]![2] as { text: string; onPress?: () => void }[]
    buttons[0]!.onPress?.()
    expect(h.remove).not.toHaveBeenCalled()
  })
})
