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

describe('markdown tables', () => {
  it('reads a header, its rule line and the rows, with escaped pipes kept in the cell', () => {
    expect(splitBotText('이렇게 고칠게요.\n| 구분 | 섹션 |\n| --- | --- |\n| 강화 | 경력 \\| 모아페이 |\n| 수정 | 기술 스택 |\n끝')).toEqual([
      { kind: 'paragraph', text: '이렇게 고칠게요.' },
      { kind: 'table', head: ['구분', '섹션'], rows: [['강화', '경력 | 모아페이'], ['수정', '기술 스택']] },
      { kind: 'paragraph', text: '끝' },
    ])
  })
  it('keeps a pipe line with no rule line below it as text', () => {
    expect(splitBotText('| 구분 | 섹션 |')).toEqual([{ kind: 'paragraph', text: '| 구분 | 섹션 |' }])
  })
})

describe('marked lists and link lines of a document run (ChatPh3Review, ChatPh6Result)', () => {
  it('keeps "- " lines marker-less and gives "• " lines their own marked block', () => {
    expect(splitBotText('고쳤어요.\n- 가\n• 나\n• 다')).toEqual([
      { kind: 'paragraph', text: '고쳤어요.' },
      { kind: 'list', items: ['가'] },
      { kind: 'bullets', items: ['나', '다'] },
    ])
  })
  it('reads a line that opens with [label](/route) as a link line with its grey tail', () => {
    expect(splitBotText('끝\n[이력서 초안 v1](/docs/push/d1) · 미리보기')).toEqual([
      { kind: 'paragraph', text: '끝' },
      { kind: 'link', label: '이력서 초안 v1', route: '/docs/push/d1', tail: ' · 미리보기' },
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

describe('splitBotText headings and grey lines (ChatResume)', () => {
  it('reads # as a title, ### as a role line and > as a grey line that may open a route', () => {
    expect(splitBotText('있어요.\n# 김서준 · 백엔드 개발자\n### 모아페이 · 2022.03–현재\n• 승인 API\n> [초안 전체 보기](/docs/push/d1) ›\n> 메모')).toEqual([
      { kind: 'paragraph', text: '있어요.' },
      { kind: 'heading', level: 1, text: '김서준 · 백엔드 개발자' },
      { kind: 'heading', level: 2, text: '모아페이 · 2022.03–현재' },
      { kind: 'bullets', items: ['승인 API'] },
      { kind: 'sub', text: '초안 전체 보기 ›', route: '/docs/push/d1' },
      { kind: 'sub', text: '메모' },
    ])
  })
})
