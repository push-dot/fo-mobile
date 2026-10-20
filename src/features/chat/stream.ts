import type { StreamEvent } from '@push/api-client'
import type { ChatEvent } from './types'

export const errorText = (code?: string) =>
  code === 'FEATURE_DISABLED'
    ? '크레딧이 모자라요. 요금제에서 충전할 수 있어요.'
    : code === 'INTEGRATION_REQUIRED'
      ? 'AI 키를 연결해야 쓸 수 있어요.'
      : '작업을 이어가지 못했어요. 다시 보내 주세요.'

/**
 * push-be SSE frames (token · status · done · error) → transcript events. Tool/todo/diff items only come from
 * the mock script. The gateway closes long streams early, so a stream that ends without done/error is resumed
 * from the last `seq` via stream/active until a resume brings nothing (204 = run finished).
 */
export async function* fromStream(
  first: AsyncIterable<StreamEvent>,
  resume: (after?: number) => AsyncIterable<StreamEvent>,
): AsyncGenerator<ChatEvent> {
  let seq: number | undefined
  for (let source = first; ; source = resume(seq)) {
    let got = false
    for await (const ev of source) {
      got = true
      if (ev.seq !== undefined) seq = ev.seq
      if (ev.type === 'token') yield { type: 'token', text: ev.text }
      else if (ev.type === 'status') yield { type: 'status', verbs: [ev.text] }
      else if (ev.type === 'error') return yield { type: 'error', id: `err-${Date.now()}`, text: errorText(ev.error.code) }
      else return yield { type: 'done', at: 0 }
    }
    if (!got && source !== first) return
    // Without seq a resume would replay from the start and duplicate text.
    if (got && seq === undefined) return
  }
}
