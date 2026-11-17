import { describe, expect, it } from 'vitest'
import type { ChatItem, DiffLine } from '../types'
import { latestDiffLines, reviewRows, strongParts } from '../utils/review-doc'

const text = (row: { parts: { text: string }[] }) => row.parts.map((p) => p.text).join('')

describe('strongParts', () => {
  it('bolds a number that moved or carries a unit, not digits inside a word', () => {
    expect(strongParts('결제 승인 API 재설계, p95 320ms → 140ms')).toEqual([{ text: '결제 승인 API 재설계, p95 ' }, { text: '320ms → 140ms', strong: true }])
    expect(strongParts('승인 성공률 99.98%를 지켰어요')).toEqual([{ text: '승인 성공률 ' }, { text: '99.98%', strong: true }, { text: '를 지켰어요' }])
    expect(strongParts('실패율 2.1% → 0.3%')).toEqual([{ text: '실패율 ' }, { text: '2.1% → 0.3%', strong: true }])
    expect(strongParts('p95 응답, 3가지 방식')).toEqual([{ text: 'p95 응답, 3가지 방식' }])
  })
})

describe('reviewRows', () => {
  const lines: DiffLine[] = [
    { sign: '', text: '# 김서준\n결제 시스템을 만드는 백엔드 개발자 · 4년차' },
    { sign: '', text: '## 경력' },
    { sign: '', text: '모아페이 · 백엔드 엔지니어 · 2022.03 – 현재' },
    { sign: '-', text: '결제 승인 API와 정산 배치를 맡고 있어요.' },
    { sign: '+', text: '- 결제 승인 API 재설계, p95 320ms → 140ms\n- 정산 배치 장애 대응, 실패율 2.1% → 0.3%' },
    { sign: '~', text: 'Kafka 기반 결제 이벤트 파이프라인 구축' },
  ]
  const rows = reviewRows(lines)

  it('reads the markdown lines of the whole document', () => {
    expect(rows.map((r) => r.kind)).toEqual(['title', 'headline', 'section', 'role', 'text', 'text', 'text', 'text'])
    expect(text(rows[0]!)).toBe('김서준')
    expect(text(rows[1]!)).toBe('결제 시스템을 만드는 백엔드 개발자 · 4년차')
  })

  it('splits a role line from its date', () => {
    expect(text(rows[3]!)).toBe('모아페이 · 백엔드 엔지니어')
    expect(rows[3]!.date).toBe('2022.03 – 현재')
  })

  it('keeps each changed line as its own row with its sign, a moved line as an added one', () => {
    expect(rows.slice(4).map((r) => r.sign)).toEqual(['-', '+', '+', '+'])
    expect(text(rows[5]!)).toBe('결제 승인 API 재설계, p95 320ms → 140ms')
    expect(rows[5]!.parts.filter((p) => p.strong).map((p) => p.text)).toEqual(['320ms → 140ms'])
    expect(rows[4]!.parts.some((p) => p.strong)).toBe(false)
  })

  it('draws what the server sends today: one removed block and one added block with no document around them', () => {
    const only = reviewRows([{ sign: '-', text: '결제 API 개발' }, { sign: '+', text: '결제 승인 API 재설계\nKafka 파이프라인' }])
    expect(only.map((r) => [r.sign, text(r)])).toEqual([['-', '결제 API 개발'], ['+', '결제 승인 API 재설계'], ['+', 'Kafka 파이프라인']])
  })
})

describe('latestDiffLines', () => {
  const diff: ChatItem = { type: 'diff', id: 'd', lines: [{ sign: '+', text: 'a' }] }
  it('reads the edit since the person last spoke, from the bubble or the line', () => {
    expect(latestDiffLines([{ type: 'user', id: 'u', text: 'x' }, diff])).toEqual(diff.type === 'diff' ? diff.lines : [])
    expect(latestDiffLines([{ type: 'agentText', id: 't', text: 'x', diff: diff as Extract<ChatItem, { type: 'diff' }> }])).toHaveLength(1)
    expect(latestDiffLines([diff, { type: 'user', id: 'u', text: 'x' }])).toEqual([])
  })
})
