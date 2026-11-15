import { describe, expect, it } from 'vitest'
import { diffBubble, fitBubble, todoLines } from '../utils/bubble-detail'
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

  it('has no sub-text when the card has no parts', () => {
    expect(fitBubble({ type: 'fit', id: 'f', score: 7, caption: '공고 기준' })).toEqual({ text: '적합도 **7.0** / 10 · 공고 기준' })
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
