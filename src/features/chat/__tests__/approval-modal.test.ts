import { describe, expect, it } from 'vitest'
import type { Approval, ApprovalSection } from '../types'
import { approvalModalKind } from '../utils/approval-modal'

const card = (...sections: ApprovalSection[]): Approval => ({ id: 'a', question: '?', sections, optionIds: [] })

describe('approvalModalKind', () => {
  it('a form with rows to change is a page-style modal', () => {
    expect(approvalModalKind(card({ kind: 'rows', title: '가져올 자료', items: [] }, { kind: 'chips', options: ['원래 말투로'], selected: [] }))).toBe('page')
  })

  it('a plain choice, chip or template card is no page modal', () => {
    expect(approvalModalKind(card({ kind: 'choices', items: [{ label: '예' }], selected: [0] }))).toBe('none')
    expect(approvalModalKind(card({ kind: 'chips', options: ['성능'], multi: true, selected: [] }))).toBe('none')
    expect(approvalModalKind(card({ kind: 'templates', items: [{ label: '클래식' }], selected: [0] }))).toBe('none')
  })
})
