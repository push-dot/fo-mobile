import { describe, expect, it } from 'vitest'
import { mockFetch } from '../server'
import { seedThread } from '../bots'
import '../bot-chat'
import { pick } from '../bot-scripts/runs'

const matches = async (q: string) => {
  const res = await mockFetch(new Request(`http://x/api/v1/bots/b-moa/transcript/matches?q=${encodeURIComponent(q)}`))
  return ((await res.json()) as { data: { total: number; items: { messageId: string }[] } }).data
}

describe('ChatBotHeaderFind: the finished chat of ChatBotHeader', () => {
  it('finds the user line "Push 프로필로" once and no save sentence in the answer', async () => {
    seedThread('b-moa', 'thread')
    const { total, items } = await matches('프로필')
    expect(items.map((m) => m.messageId)).toEqual(['m-t-ask-USER'])
    expect(total).toBe(1)
    expect((await matches('저장했어요')).total).toBe(0)
  })
})

describe('ChatStates.2: the board draws a finished 3-line answer', () => {
  it('ends the run without awaiting a confirmation', () => {
    const steps = pick('경력 섹션을 공고에 맞게 고쳐 줘', false)!.steps
    expect(JSON.stringify(steps.at(-1))).not.toContain('awaiting')
  })
})
