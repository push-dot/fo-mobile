import { ApiError } from '@push/api-client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE_REFERENCED, RESTORE_FAILED } from './utils'
import { UNDO_MS } from './constants'

const remove = vi.hoisted(() => vi.fn())
const archive = vi.hoisted(() => vi.fn())
const restore = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const showToast = vi.hoisted(() => vi.fn())
vi.mock('./api', () => ({ myApi: { remove, archive, restore } }))
vi.mock('@/providers/query-client', () => ({ queryClient: { invalidateQueries } }))
vi.mock('@/shared/components', () => ({ showToast }))

const { deleteWithUndo, usePendingDelete } = await import('./stores')

const doc = { id: 's1', fileName: '이력서.pdf' }
const other = { id: 's2', fileName: '경력기술서.docx' }
const lastToast = () => showToast.mock.lastCall?.[0]
const tapUndo = () => showToast.mock.lastCall?.[0].action.onPress()

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  remove.mockResolvedValue(undefined)
  archive.mockResolvedValue(undefined)
  restore.mockResolvedValue(undefined)
  invalidateQueries.mockResolvedValue(undefined)
  usePendingDelete.setState({ hidden: [] })
})
afterEach(async () => {
  await vi.runAllTimersAsync()
  vi.useRealTimers()
})

describe('deleteWithUndo', () => {
  it('archives a Push document (origin AI) instead of DELETE sources/:id, which push-be answers 404', async () => {
    deleteWithUndo({ id: 'doc-ai', fileName: '모아페이_맞춤_이력서_v2.pdf', aiMade: true })
    await vi.advanceTimersByTimeAsync(UNDO_MS)
    expect(archive).toHaveBeenCalledExactlyOnceWith('doc-ai')
    expect(remove).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['documents'] })
  })

  it('hides the doc and offers 되돌리기 without deleting yet', () => {
    deleteWithUndo(doc)
    expect(usePendingDelete.getState().hidden).toEqual(['s1'])
    expect(showToast.mock.lastCall?.[0].action.label).toBe('되돌리기')
    expect(remove).not.toHaveBeenCalled()
  })

  it('calls documents.restore when 되돌리기 is tapped after a Push document commits', async () => {
    deleteWithUndo({ id: 'doc-ai', fileName: '모아페이_맞춤_이력서_v2.pdf', aiMade: true })
    await vi.advanceTimersByTimeAsync(UNDO_MS)
    expect(archive).toHaveBeenCalledExactlyOnceWith('doc-ai')
    tapUndo()
    await Promise.resolve()
    expect(restore).toHaveBeenCalledExactlyOnceWith('doc-ai')
  })

  it('says the undo failed when documents.restore rejects', async () => {
    restore.mockRejectedValueOnce(new Error('offline'))
    deleteWithUndo({ id: 'doc-restore', fileName: '모아페이_맞춤_이력서_v2.pdf', aiMade: true })
    await vi.advanceTimersByTimeAsync(UNDO_MS)
    tapUndo()
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(restore).toHaveBeenCalledOnce()
    expect(lastToast()).toMatchObject({ message: RESTORE_FAILED, alert: true })
  })

  it('does not restore a Push document when 되돌리기 lands before the archive', async () => {
    deleteWithUndo({ id: 'doc-ai', fileName: '모아페이_맞춤_이력서_v2.pdf', aiMade: true })
    tapUndo()
    await vi.runAllTimersAsync()
    expect(archive).not.toHaveBeenCalled()
    expect(restore).not.toHaveBeenCalled()
    expect(usePendingDelete.getState().hidden).toEqual([])
  })

  it('does not restore an uploaded file after its delete commits', async () => {
    deleteWithUndo(doc)
    await vi.advanceTimersByTimeAsync(UNDO_MS)
    tapUndo()
    await vi.runAllTimersAsync()
    expect(remove).toHaveBeenCalledOnce()
    expect(restore).not.toHaveBeenCalled()
  })

  it('says the upload is still used by a career record when delete answers 409 REFERENCED_BY_EVIDENCE', async () => {
    remove.mockRejectedValueOnce(new ApiError('conflict', 'INVALID_TRANSITION', 409, { reason: 'REFERENCED_BY_EVIDENCE', evidenceCount: 1 }))
    deleteWithUndo(doc, 74)
    await vi.runAllTimersAsync()
    expect(lastToast()).toMatchObject({ message: DELETE_REFERENCED, alert: true, opaque: true, bottom: 74 })
    expect(lastToast().action).toBeUndefined()
    expect(usePendingDelete.getState().hidden).toEqual([])
  })

  it('restores the doc when 되돌리기 is tapped after the screen is gone', async () => {
    deleteWithUndo(doc)
    vi.advanceTimersByTime(UNDO_MS - 1)
    tapUndo()
    await vi.runAllTimersAsync()
    expect(remove).not.toHaveBeenCalled()
    expect(usePendingDelete.getState().hidden).toEqual([])
  })

  it('deletes once when the undo window ends, and keeps the row hidden until the list refetches', async () => {
    let refetched = () => {}
    invalidateQueries.mockReturnValue(new Promise<void>((r) => (refetched = r)))
    deleteWithUndo(doc)
    await vi.advanceTimersByTimeAsync(UNDO_MS)
    expect(remove).toHaveBeenCalledExactlyOnceWith('s1')
    expect(usePendingDelete.getState().hidden).toEqual(['s1'])
    refetched()
    await vi.runAllTimersAsync()
    expect(remove).toHaveBeenCalledTimes(1)
    expect(usePendingDelete.getState().hidden).toEqual([])
  })

  it('shows the doc again when the delete fails', async () => {
    remove.mockRejectedValue(new Error('offline'))
    deleteWithUndo(doc)
    await vi.runAllTimersAsync()
    expect(usePendingDelete.getState().hidden).toEqual([])
  })

  it('shows the failure toast whose 다시 시도 deletes again', async () => {
    remove.mockRejectedValueOnce(new Error('offline'))
    deleteWithUndo(doc, 74)
    await vi.runAllTimersAsync()
    const toast = showToast.mock.lastCall?.[0]
    expect(toast).toMatchObject({ message: '서류를 삭제하지 못했어요', alert: true, opaque: true, bottom: 74 })
    toast.action.onPress()
    await vi.runAllTimersAsync()
    expect(remove).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenCalledOnce()
  })

  it("keeps the next doc's 되돌리기 on screen when the earlier delete fails, then shows the failure", async () => {
    remove.mockRejectedValueOnce(new Error('offline'))
    deleteWithUndo(doc)
    deleteWithUndo(other)
    await vi.advanceTimersByTimeAsync(0)
    expect(remove).toHaveBeenCalledExactlyOnceWith('s1')
    expect(lastToast()).toMatchObject({ message: '서류를 삭제했어요', action: { label: '되돌리기' } })
    lastToast().action.onPress()
    expect(lastToast()).toMatchObject({ message: '서류를 삭제하지 못했어요', alert: true })
    expect(usePendingDelete.getState().hidden).toEqual([])
    lastToast().action.onPress()
    await vi.runAllTimersAsync()
    expect(remove).toHaveBeenLastCalledWith('s1')
    expect(remove).toHaveBeenCalledTimes(2)
  })

  it('shows a held failure once the next undo window ends', async () => {
    remove.mockRejectedValueOnce(new Error('offline'))
    deleteWithUndo(doc)
    deleteWithUndo(other)
    await vi.advanceTimersByTimeAsync(UNDO_MS - 1)
    expect(lastToast().action.label).toBe('되돌리기')
    await vi.advanceTimersByTimeAsync(1)
    expect(lastToast()).toMatchObject({ message: '서류를 삭제하지 못했어요' })
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
