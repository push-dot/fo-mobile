import { describe, expect, it } from 'vitest'
import { fitChrome } from '../utils/fit-card'
import { resultTask } from '../utils/result-card'
import { FIT_TEASER } from '../constants'

const card = { rows: [{ label: '기술 스택', score: 7.5 }], summary: '기술 스택은 잘 맞아요.', projected: { label: '8점대', bullets: ['Kafka를 맨 앞으로'] } }

describe('fit card by plan', () => {
  it('locks the parts on FREE and hides the summary', () => {
    expect(fitChrome({ ...card, plan: 'FREE' })).toEqual({ locked: true, summary: undefined, teaser: undefined, projected: undefined })
  })

  it('shows the parts, the summary and the ULTRA teaser on PRO', () => {
    expect(fitChrome({ ...card, plan: 'PRO' })).toEqual({ locked: false, summary: card.summary, teaser: FIT_TEASER, projected: undefined })
  })

  it('drops the ULTRA teaser while payments are closed', () => {
    expect(fitChrome({ ...card, plan: 'PRO' }, false)).toEqual({ locked: false, summary: card.summary, teaser: undefined, projected: undefined })
  })

  it('shows the projection on ULTRA', () => {
    expect(fitChrome({ ...card, plan: 'ULTRA' })).toEqual({ locked: false, summary: card.summary, teaser: undefined, projected: card.projected })
  })

  it('shows everything it got when the plan is unknown (mock and boost cards)', () => {
    expect(fitChrome({ rows: card.rows })).toEqual({ locked: false, summary: undefined, teaser: undefined, projected: undefined })
  })
})

describe('result task line', () => {
  it('splits the task line into the tool action and its target', () => {
    expect(resultTask('프로필 수정 · Push 프로필 · 경력')).toEqual({ action: '프로필 수정', target: 'Push 프로필 · 경력' })
    expect(resultTask('이력서 수정')).toEqual({ action: '이력서 수정', target: undefined })
  })
})
