import { describe, expect, it } from 'vitest'
import { clampByWords } from './word-clamp'

const lines = ['주말 사이드 프로젝트를 같이 하실 백엔드 ', '개발자를 찾고 있어요. 정산 쪽 경험이 ', '있으시면 큰 도움이 될 것 같아요.']

describe('clampByWords', () => {
  it('ends line 2 on its last whole word, as ProposalInbox draws it', () => {
    expect(clampByWords(lines, 2, 0)).toBe('주말 사이드 프로젝트를 같이 하실 백엔드 개발자를 찾고 있어요. 정산 쪽 경험이…')
  })

  it('drops whole words when the ellipsis does not fit', () => {
    expect(clampByWords(lines, 2, 2)).toBe('주말 사이드 프로젝트를 같이 하실 백엔드 개발자를 찾고 있어요. 정산…')
  })

  it('keeps one word of the last line however many are dropped', () => {
    expect(clampByWords(lines, 2, 99)).toBe('주말 사이드 프로젝트를 같이 하실 백엔드 개발자를…')
  })

  it('leaves text that fits unchanged', () => {
    expect(clampByWords(lines.slice(0, 2), 2, 0)).toBe(lines.slice(0, 2).join(''))
  })
})
