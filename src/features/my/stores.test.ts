import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UNDO_MS } from './constants'

const remove = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const showToast = vi.hoisted(() => vi.fn())
vi.mock('./api', () => ({ myApi: { remove } }))
vi.mock('@/providers/query-client', () => ({ queryClient: { invalidateQueries } }))
vi.mock('@/shared/components', () => ({ showToast, TOAST_ABOVE: { tabs: 74 } }))

const { deleteWithUndo, usePendingDelete } = await import('./stores')

const doc = { id: 's1', fileName: '이력서.pdf' }
const tapUndo = () => showToast.mock.lastCall?.[0].action.onPress()

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  remove.mockResolvedValue(undefined)
  invalidateQueries.mockResolvedValue(undefined)
  usePendingDelete.setState({ hidden: [] })
})
afterEach(async () => {
  await vi.runAllTimersAsync()
  vi.useRealTimers()
})

describe('deleteWithUndo', () => {
  it('hides the doc and offers 되돌리기 without deleting yet', () => {
    deleteWithUndo(doc)
    expect(usePendingDelete.getState().hidden).toEqual(['s1'])
    expect(showToast.mock.lastCall?.[0].action.label).toBe('되돌리기')
    expect(remove).not.toHaveBeenCalled()
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
})
