import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { mapEvent } from '../utils/stream'

const tool = (patch: Partial<Extract<StreamEvent, { type: 'tool' }>> = {}): StreamEvent => ({
  type: 'tool',
  name: 'update_my_profile',
  state: 'ok',
  summary: '프로필을 고치는 중',
  result: { headline: '시니어', changeId: 'c1' },
  ...patch,
})

describe('profile undo from the thread data', () => {
  it('draws the 되돌리기 line from the changeId on the tool line, live or reopened', () => {
    const events = mapEvent(tool())
    expect(events.map((e) => e.type)).toEqual(['tool', 'agentText'])
    expect(events[1]).toMatchObject({ type: 'agentText', id: 'undo-c1', text: '프로필을 고쳤어요.', undo: 'c1' })
  })

  it('draws nothing for a run that changed nothing, failed, or is another tool', () => {
    expect(mapEvent(tool({ result: { headline: '시니어' } })).map((e) => e.type)).toEqual(['tool'])
    expect(mapEvent(tool({ state: 'err', result: { error: 'x', changeId: 'c1' } })).map((e) => e.type)).toEqual(['tool'])
    expect(mapEvent(tool({ name: 'bookmark_posting' })).map((e) => e.type)).toEqual(['tool'])
  })

  it('does not grow the 되돌리기 line with the reply that follows', () => {
    let s = emptyChat
    for (const e of [...mapEvent(tool()), { type: 'token' as const, text: '바꿨어요.' }]) s = applyEvent(s, e)
    expect(s.items.filter((x) => x.type === 'agentText').map((x) => (x.type === 'agentText' ? x.text : ''))).toEqual(['프로필을 고쳤어요.', '바꿨어요.'])
  })
})

describe('result gate without a question', () => {
  it('draws nothing when the server sends the profile result gate with auto set', () => {
    const present = { type: 'choice' as const, id: 'present', gate: 'present', auto: true, recommended: 'done', options: [{ id: 'done', label: '확인했어요' }] }
    expect(mapEvent(present)).toEqual([])
  })
})
