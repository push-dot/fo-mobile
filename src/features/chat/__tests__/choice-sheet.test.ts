import { describe, expect, it } from 'vitest'
import { choiceInThread, choiceSheet } from '../utils/choice-sheet'
import { composerPlaceholder } from '../utils/usage'
import type { Approval } from '../types'

const card = (patch: Partial<Approval>): Approval => ({
  id: 'a1',
  question: '모아페이 채용 페이지를 열어도 될까요?',
  sections: [{ kind: 'choices', selected: [], items: [{ label: '한 번 허용' }, { label: '항상 허용', desc: '이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요' }, { label: '거절' }] }],
  optionIds: ['approve', 'approve_always', 'reject'],
  ...patch,
})

const gate = (patch: Partial<Approval> = {}): Approval =>
  card({
    question: '이 전략대로 초안을 쓸까요?',
    sections: [{ kind: 'choices', selected: [0], items: [{ label: '초안 쓸게요' }, { label: '피드백만 볼게요' }, { label: '닫기' }] }],
    optionIds: ['0', '1', '2'],
    ...patch,
  })

describe('choiceSheet', () => {
  it('turns the permission card into a title, its detail as the message, and a destructive 거절', () => {
    expect(choiceSheet(card({ question: '채용 페이지 열기', detail: '모아페이 채용 페이지(careers.moapay.co.kr)를 열어도 될까요?', confirm: true }))).toEqual({
      title: '채용 페이지 열기',
      message: '모아페이 채용 페이지(careers.moapay.co.kr)를 열어도 될까요?',
      items: [
        { index: 0, label: '한 번 허용', destructive: false },
        { index: 1, label: '항상 허용', destructive: false },
        { index: 2, label: '거절', destructive: true },
      ],
    })
  })

  it('leaves 직접 말하기 to the composer and keeps the indexes of the rest', () => {
    const sheet = choiceSheet(
      card({ sections: [{ kind: 'choices', selected: [], items: [{ label: '제품 관점' }, { label: '데이터 관점' }, { label: '직접 입력할게요', hint: '직접 말하기' }] }], optionIds: ['a', 'b', 'c'] }),
    )
    expect(sheet?.items.map((i) => i.index)).toEqual([0, 1])
  })

  it('leaves cards with a confirm button, several picks or sections to the drawn panel', () => {
    expect(choiceSheet(card({ submit: '보내기' }))).toBeNull()
    expect(choiceSheet(card({ sections: [{ kind: 'choices', selected: [], multi: true, items: [{ label: 'a' }] }] }))).toBeNull()
    expect(choiceSheet(card({ sections: [{ kind: 'chips', selected: [], options: ['a'] }] }))).toBeNull()
  })
})

describe('choiceInThread', () => {
  it('draws a flow gate with a suggested option as the numbered bubble, with the composer asking to pick or say', () => {
    expect(choiceInThread(gate())).toBe(true)
    expect(composerPlaceholder({ items: [], working: null, approval: gate() }, '모아페이')).toBe('골라 주시거나 직접 말해 주세요')
  })

  it('keeps a permission and a help question with no suggestion as the modal', () => {
    expect(choiceInThread(card({ confirm: true }))).toBe(false)
    expect(choiceInThread(card({ confirm: undefined }))).toBe(false)
    expect(composerPlaceholder({ items: [], working: null, approval: card({ confirm: true }) }, '모아페이')).not.toBe('골라 주시거나 직접 말해 주세요')
  })

  it('keeps multi picks and confirm-button cards out of the thread', () => {
    expect(choiceInThread(gate({ submit: '보내기' }))).toBe(false)
  })
})
