import { beforeEach, describe, expect, it, vi } from 'vitest'

const showChoiceModal = vi.fn()
vi.mock('expo-router', () => ({ router: { push: vi.fn() }, useIsFocused: () => true }))
vi.mock('@/shared/components', () => ({ TOAST_ABOVE: {}, askConfirm: vi.fn(), showActionSheet: vi.fn(), showToast: vi.fn() }))
vi.mock('@/shared/navigation', () => ({ showChoiceModal }))
vi.mock('@/features/bots', () => ({ botChatPath: (id: string) => `/bots/${id}` }))
vi.mock('@/shared/infrastructure', () => ({ pickDocument: vi.fn() }))
vi.mock('./stores', () => ({ deleteWithUndo: vi.fn(), useDocDelete: vi.fn(), useDocImport: vi.fn(), usePendingDelete: vi.fn() }))

describe('showImportMenu', () => {
  beforeEach(() => showChoiceModal.mockClear())

  it('asks where the 서류 comes from with two rows and no size or format line (UploadPick)', async () => {
    const { showImportMenu } = await import('./hooks')
    showImportMenu()
    const request = showChoiceModal.mock.calls[0]![0]
    expect(request.title).toBe('서류 가져오기')
    expect(request.message).toBeUndefined()
    expect(request.items.map((item: { label: string }) => item.label)).toEqual(['파일에서 고르기', 'Bot 채팅에서 새로 만들기'])
  })
})
