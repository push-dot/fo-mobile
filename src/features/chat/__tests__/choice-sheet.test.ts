import { describe, expect, it } from 'vitest'
import { choiceSheet } from '../utils/choice-sheet'
import type { Approval } from '../types'

const card = (patch: Partial<Approval>): Approval => ({
  id: 'a1',
  question: '모아페이 채용 페이지를 열어도 될까요?',
  sections: [{ kind: 'choices', selected: [], items: [{ label: '한 번 허용' }, { label: '항상 허용', desc: '이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요' }, { label: '거절' }] }],
  optionIds: ['approve', 'approve_always', 'reject'],
  ...patch,
})

describe('choiceSheet', () => {
  it('turns the permission card into a title, the notes as the message, and a destructive 거절', () => {
    expect(choiceSheet(card({ detail: 'careers.moapay.co.kr · 공고 1개를 읽어요' }))).toEqual({
      title: '모아페이 채용 페이지를 열어도 될까요?',
      message: 'careers.moapay.co.kr · 공고 1개를 읽어요\n항상 허용: 이 Bot이 이 사이트를 읽을 때 다시 묻지 않아요',
      cancel: '직접 말하기',
      items: [
        { index: 0, label: '한 번 허용', destructive: false },
        { index: 1, label: '항상 허용', destructive: false },
        { index: 2, label: '거절', destructive: true },
      ],
    })
  })

  it('moves 직접 말하기 to the cancel row and keeps the indexes of the rest', () => {
    const sheet = choiceSheet(
      card({ sections: [{ kind: 'choices', selected: [], items: [{ label: '제품 관점' }, { label: '데이터 관점' }, { label: '직접 입력할게요', hint: '직접 말하기' }] }], optionIds: ['a', 'b', 'c'] }),
    )
    expect(sheet?.items.map((i) => i.index)).toEqual([0, 1])
    expect(sheet?.cancel).toBe('직접 입력할게요')
  })

  it('leaves cards with a confirm button, several picks or sections to the drawn panel', () => {
    expect(choiceSheet(card({ submit: '보내기' }))).toBeNull()
    expect(choiceSheet(card({ sections: [{ kind: 'choices', selected: [], multi: true, items: [{ label: 'a' }] }] }))).toBeNull()
    expect(choiceSheet(card({ sections: [{ kind: 'chips', selected: [], options: ['a'] }] }))).toBeNull()
  })
})
