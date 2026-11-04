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

  it('keeps the server choice detail and options', async () => {
    const resume = vi.fn(() => frames())
    const out = await collect(
      fromStream(
        frames({
          type: 'choice',
          id: 'b1',
          title: '점수를 한 번 더 올릴까요?',
          detail: '적합도 6.9 → 7.4 (+0.5)',
          options: [
            { id: 'continue', label: '한 번 더 올리기' },
            { id: 'stop', label: '여기서 멈추기' },
            { id: 'cancel', label: '그만하기' },
          ],
        }),
        resume,
      ),
    )
    expect(out[0]).toMatchObject({
      type: 'approval',
      approval: {
        question: '점수를 한 번 더 올릴까요?',
        detail: '적합도 6.9 → 7.4 (+0.5)',
        sections: [
          {
            items: [{ label: '한 번 더 올리기' }, { label: '여기서 멈추기' }, { label: '그만하기' }, { label: '직접 말하기' }],
          },
        ],
      },
    })
  })
})
