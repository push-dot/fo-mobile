import { describe, expect, it } from 'vitest'
import { diffBubble, diffLinesDetail, fitBubble, todoLines } from '../utils/bubble-detail'
import { splitBotText } from '../utils/bot-text'

describe('fitBubble', () => {
  it('puts the score in the line and the parts in the grey sub-text, long form one per line', () => {
    const view = fitBubble({
      type: 'fit', id: 'f', score: 8.1, from: 6.9, delta: '+1.2 예상',
      rows: [{ label: '기술 스택', score: 7.5 }, { label: '키워드', score: 4.5 }],
      keywords: [{ label: 'Kotlin', ok: true }, { label: 'Kafka', ok: false }],
    })
    expect(view.text).toBe('적합도 **6.9 → 8.1** · +1.2 예상')
    expect(view.detail).toEqual({ text: '기술 스택 7.5 · 키워드 4.5 · ✓ Kotlin · ✗ Kafka', more: '기술 스택 7.5\n키워드 4.5\n✓ Kotlin  ✗ Kafka' })
  })

  it('says the first fit as a sentence with the parts a tap away (ChatPh1Fit)', () => {
    const view = fitBubble({ type: 'fit', id: 'f', score: 6.9, caption: '보통이고, 고칠 여지가 있어요.', rows: [{ label: '기술 스택', score: 7.5 }, { label: '키워드', score: 4.5 }] })
    expect(view.text).toBe('적합도는 6.9점이에요. 보통이고, 고칠 여지가 있어요.')
    expect(view.detail).toEqual({ text: '항목별 점수 보기 ›', more: '기술 스택 7.5 · 키워드 4.5' })
  })

  it('has no sub-text when the card has no parts', () => {
    expect(fitBubble({ type: 'fit', id: 'f', score: 7 })).toEqual({ text: '적합도는 7.0점이에요.' })
  })
})

describe('fitBubble of a score boost (ChatPh3Boost, ChatPh3BoostStop)', () => {
  const boost = { type: 'fit' as const, id: 'f', score: 8.3, from: 6.9, delta: '+1.4', note: '적합도 6.9 → 8.3 (+1.4)' }

  it('says what the score went to in one line, with the josa the number takes', () => {
    expect(fitBubble(boost).text).toBe('적합도를 6.9 → 8.3으로 올렸어요. (+1.4)')
    expect(fitBubble({ ...boost, score: 8.1, delta: undefined }).text).toBe('적합도를 6.9 → 8.1로 올렸어요. (+1.2)')
  })

  it('names what each round raised as a marked list under the score line', () => {
    const rounds = [
      { label: '키워드', line: '6.9 → 7.5 · 정산 배치, 장애 대응을 경력 문장에 넣었어요' },
      { label: '경력 · 모아페이', line: '7.5 → 8.0 · 승인 API 성과를 숫자로 보여 줬어요' },
    ]
    expect(fitBubble({ ...boost, rounds }).list).toEqual(['키워드: 정산 배치, 장애 대응을 경력 문장에 넣었어요', '경력 · 모아페이: 승인 API 성과를 숫자로 보여 줬어요'])
  })
})

describe('diffBubble', () => {
  it('counts the changed lines and keeps every line in the long form', () => {
    const view = diffBubble({
      type: 'diff', id: 'd',
      lines: [{ n: 12, sign: '', text: '모아페이' }, { n: 13, sign: '-', text: '결제 API 개발' }, { n: 13, sign: '+', text: 'Kotlin 재설계' }],
    })
    expect(view.text).toBe('수정안이에요')
    expect(view.detail).toEqual({ text: '+1줄 · −1줄', more: '  모아페이\n− 결제 API 개발\n+ Kotlin 재설계' })
  })
})

describe('diffLinesDetail', () => {
  it('counts the changed lines as "바뀐 곳 N개 보기" and opens to every line', () => {
    const lines = [{ n: 12, sign: '' as const, text: '모아페이' }, { n: 13, sign: '-' as const, text: '결제 API 개발' }, { n: 13, sign: '+' as const, text: 'Kotlin 재설계' }]
    expect(diffLinesDetail(lines)).toEqual({ text: '바뀐 곳 1개 보기 ›', more: '  모아페이\n− 결제 API 개발\n+ Kotlin 재설계' })
  })

  it('counts a removed and an added line of the same line number as one place, and unnumbered lines one each', () => {
    expect(diffLinesDetail([{ sign: '+', text: 'a' }, { sign: '-', text: 'b' }, { sign: '+', text: 'c' }]).text).toBe('바뀐 곳 3개 보기 ›')
    expect(diffLinesDetail([{ n: 8, sign: '-', text: 'x' }, { n: 8, sign: '+', text: 'y' }, { n: 12, sign: '-', text: 'p' }, { n: 12, sign: '+', text: 'q' }]).text).toBe('바뀐 곳 2개 보기 ›')
  })
})

describe('todoLines (ChatInterrupt)', () => {
  it('is a numbered list that keeps each step state and names an added step', () => {
    expect(todoLines({ type: 'todo', id: 't', items: [{ label: '이력서 읽기', state: 'done' }, { label: '자기소개서 쓰기', state: 'now', added: true }] })).toEqual([
      { text: '1. 이력서 읽기', state: 'done' },
      { text: '2. 자기소개서 쓰기 · 새로 추가', state: 'now' },
    ])
  })
})

describe('splitBotText numbered lists', () => {
  it('reads "1." lines as one numbered list, apart from dash lists', () => {
    expect(splitBotText('순서예요.\n1. 읽기\n2) 쓰기\n- 메모')).toEqual([
      { kind: 'paragraph', text: '순서예요.' },
      { kind: 'ordered', items: ['읽기', '쓰기'] },
      { kind: 'list', items: ['메모'] },
    ])
  })
})
