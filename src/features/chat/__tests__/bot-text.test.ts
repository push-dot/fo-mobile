import { describe, expect, it } from 'vitest'
import { splitBotText } from '../utils/bot-text'
import { applyEvent, emptyChat } from '../utils/reducer'

describe('bot text blocks', () => {
  it('keeps a plain answer as one paragraph', () => {
    expect(splitBotText('경력 섹션 3줄을 고쳤어요.')).toEqual([{ kind: 'paragraph', text: '경력 섹션 3줄을 고쳤어요.' }])
  })
  it('turns dash lines under a paragraph into one list', () => {
    expect(splitBotText('요건을 정리했어요.\n- 결제 승인 API\n- 정산 배치\n* Kafka')).toEqual([
      { kind: 'paragraph', text: '요건을 정리했어요.' },
      { kind: 'list', items: ['결제 승인 API', '정산 배치', 'Kafka'] },
    ])
  })
})

describe('answer sources', () => {
  const sources = [{ kind: 'posting' as const, id: 'p1', title: '모아페이 채용 공고' }]
  it('land on the last bot line of the turn', () => {
    const said = applyEvent(emptyChat, { type: 'agentText', id: 'a', text: '고쳤어요.' })
    const done = applyEvent(said, { type: 'sources', sources })
    expect(done.items[0]).toMatchObject({ type: 'agentText', sources })
  })
  it('are dropped when the turn said nothing', () => {
    const asked = applyEvent(emptyChat, { type: 'user', id: 'u', text: '해 줘' })
    expect(applyEvent(asked, { type: 'sources', sources }).items).toEqual(asked.items)
  })
})
