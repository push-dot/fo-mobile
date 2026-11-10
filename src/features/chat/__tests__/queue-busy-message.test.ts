import type { StreamEvent } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { errorText, fromStream } from '../utils/stream'

async function* frames(...evs: StreamEvent[]) {
  yield* evs
}

const collect = async <T>(source: AsyncIterable<T>) => {
  const out: T[] = []
  for await (const item of source) out.push(item)
  return out
}

describe('QUEUE_BUSY with reason BILLING_LOCKED', () => {
  it('uses the same billing line as the web stream error', async () => {
    expect(errorText('QUEUE_BUSY', 5, 'BILLING_LOCKED')).toBe(
      '결제 정보를 정리하고 있어요. 5초 뒤에 다시 보내 주세요.',
    )
    expect(errorText('QUEUE_BUSY', 12)).toBe('지금 요청이 많아요. 12초 뒤에 다시 보내 주세요.')
    expect(errorText('QUEUE_BUSY', undefined, 'BILLING_LOCKED')).toBe(
      '지금 요청이 많아요. 잠시 뒤에 다시 보내 주세요.',
    )
    const out = await collect(
      fromStream(
        frames({
          type: 'error',
          error: {
            code: 'QUEUE_BUSY',
            message: 'billing is busy',
            details: { retryAfterSec: 5, ahead: 0, reason: 'BILLING_LOCKED' },
          },
        }),
        vi.fn(),
      ),
    )
    expect(out).toMatchObject([
      {
        type: 'error',
        code: 'QUEUE_BUSY',
        text: '결제 정보를 정리하고 있어요. 5초 뒤에 다시 보내 주세요.',
      },
    ])
  })
})
