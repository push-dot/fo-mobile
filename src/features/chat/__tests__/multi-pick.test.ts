import { describe, expect, it } from 'vitest'
import type { Approval } from '../types'
import { multiPick } from '../utils/multi-pick'

const items = ['성능', '보안', '그만하기'].map((label) => ({ label }))
const gate = (extra: Partial<Approval> = {}): Approval => ({
  id: 'g',
  question: '어떤 문제를 예방할까요?',
  submit: '이대로 진행',
  sections: [{ kind: 'choices', multi: true, selected: [], items }],
  ...extra,
})

describe('multiPick', () => {
  it('counts the picks on the button and disables it at zero', () => {
    expect(multiPick(gate(), [[]])).toMatchObject({ picked: 0, submitLabel: '0개로 진행하기', disabled: true })
    expect(multiPick(gate(), [[0, 1]])).toMatchObject({ picked: 2, submitLabel: '2개로 진행하기', disabled: false })
  })

  it('takes the stop row out of the grid and makes it the stop button', () => {
    expect(multiPick(gate(), [[0]])).toMatchObject({ stopAt: 2, stopLabel: '그만하기' })
  })

  it('prefers an explicit secondary label', () => {
    expect(multiPick(gate({ secondary: '취소' }), [[0]]).stopLabel).toBe('취소')
  })

  it('leaves single-pick gates alone', () => {
    const edit = gate({ sections: [], submit: '적용', secondary: '그대로 두기' })
    expect(multiPick(edit, [])).toMatchObject({ at: -1, submitLabel: '적용', disabled: false, stopLabel: '그대로 두기' })
  })
})
