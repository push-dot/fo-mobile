import { describe, expect, it } from 'vitest'
import { mockFetch } from '../server'
import { seedThread } from '../bots'
import '../bot-chat'
import { pick } from '../bot-scripts/runs'

const matches = async (q: string) => {
  const res = await mockFetch(new Request(`http://x/api/v1/bots/b-moa/transcript/matches?q=${encodeURIComponent(q)}`))
  return ((await res.json()) as { data: { total: number; items: { messageId: string }[] } }).data
}

describe('ChatBotHeaderFind: 2/3 with three hits', () => {
  it('counts the source line "…pdf" as a hit before the answer text, then the user line', async () => {
    seedThread('b-moa', 'thread')
    const { total, items } = await matches('PDF')
    // newest first: source of the answer (1/3), the answer's PDF는 (2/3), the user's PDF로 (3/3)
    expect(items.map((m) => m.messageId)).toEqual(['m-t-ask-ASSISTANT', 'm-t-ask-ASSISTANT', 'm-t-ask-USER'])
    expect(total).toBe(3)
  })
})

describe('ChatStates.2: the board draws a finished 3-line answer', () => {
  it('ends the run without awaiting a confirmation', () => {
    const steps = pick('경력 섹션을 공고에 맞게 고쳐 줘', false)!.steps
    expect(JSON.stringify(steps.at(-1))).not.toContain('awaiting')
  })
})
