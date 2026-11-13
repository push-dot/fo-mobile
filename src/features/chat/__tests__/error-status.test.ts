import { describe, expect, it } from 'vitest'
import { DEFAULT_ERROR_TEXT, DISCONNECT_REASON } from '../constants'
import { errorReason, mapEvent } from '../utils/stream'
import { statusLineView } from '../utils/status-line'

const errorFrame = (code: string, details?: Record<string, unknown>) =>
  ({ type: 'error', seq: 4, error: { code, message: code, ...(details ? { details } : {}) } }) as Parameters<typeof mapEvent>[0]

describe('a run error drawn as the status line (ChatBotStatusError)', () => {
  it('carries the reason of a code the app has no sentence for', () => {
    expect(mapEvent(errorFrame('DISCONNECTED', { reason: '연결 끊김' }))).toEqual([
      { type: 'error', id: 'err-4', text: DEFAULT_ERROR_TEXT, code: 'DISCONNECTED', reason: '연결 끊김' },
    ])
  })

  it('leaves the sentence-only errors as lines of their own', () => {
    expect(errorReason('NOT_CONFIGURED', '점검 중')).toBeUndefined()
    expect(errorReason('QUEUE_BUSY', '12초 뒤')).toBeUndefined()
    expect(errorReason('DISCONNECTED', undefined)).toBeUndefined()
    expect(mapEvent(errorFrame('UNKNOWN'))[0]).not.toHaveProperty('reason')
  })

  it('draws 작업 중 문제가 생겼어요 with the reason as its tail, as an alert', () => {
    expect(statusLineView({ kind: 'error', code: 'DISCONNECTED', reason: DISCONNECT_REASON }, new Date(0))).toMatchObject({
      text: '작업 중 문제가 생겼어요',
      tail: '연결 끊김',
      role: 'alert',
    })
  })
})
