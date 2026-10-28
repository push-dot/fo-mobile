import type { StreamEvent } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { fromStream } from '../utils/stream'

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}
const collect = async <T,>(g: AsyncIterable<T>) => {
  const out: T[] = []
  for await (const x of g) out.push(x)
  return out
}

describe('fromStream', () => {
  it('maps frames and resumes a cut stream from the last seq', async () => {
    const resume = vi.fn((after?: number) =>
      after === 2 ? frames({ type: 'token', text: '요', seq: 3 }, { type: 'done', operation: null, seq: 4 }) : frames(),
    )
    const out = await collect(fromStream(frames({ type: 'status', text: '읽는 중', seq: 1 }, { type: 'token', text: '좋아', seq: 2 }), resume))
    expect(out).toEqual([
      { type: 'status', verbs: ['읽는 중'] },
      { type: 'token', text: '좋아' },
      { type: 'token', text: '요' },
      { type: 'done', at: 0 },
    ])
    expect(resume).toHaveBeenCalledTimes(1)
    expect(resume).toHaveBeenCalledWith(2)
  })

  it('stops on error, on an empty resume, and when there is no seq to resume from', async () => {
    const resume = vi.fn(() => frames())
    const err = await collect(fromStream(frames({ type: 'error', error: { code: 'FEATURE_DISABLED', message: '' } }), resume))
    expect(err).toMatchObject([{ type: 'error', text: expect.stringContaining('크레딧') }])
    expect(resume).not.toHaveBeenCalled()
    expect(await collect(fromStream(frames({ type: 'token', text: 'a', seq: 1 }), resume))).toEqual([{ type: 'token', text: 'a' }])
    expect(resume).toHaveBeenCalledTimes(1)
    // No seq: resuming would replay from the start, so it stops instead.
    expect(await collect(fromStream(frames({ type: 'token', text: 'b' }), resume))).toEqual([{ type: 'token', text: 'b' }])
    expect(resume).toHaveBeenCalledTimes(1)
  })
})
