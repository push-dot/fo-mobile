import { describe, expect, it } from 'vitest'
import type { DiffLine } from '../types'
import { reviewRows, strongParts } from '../utils/review-doc'

const text = (row: { parts: { text: string }[] }) => row.parts.map((p) => p.text).join('')

describe('strongParts', () => {
  it('bolds a number that is new or moved against the removed line, not digits inside a word', () => {
    expect(strongParts('결제 승인 API 재설계, p95 320ms → 140ms', '결제 승인 API와 정산 배치를 맡고 있어요.')).toEqual([{ text: '결제 승인 API 재설계, p95 ' }, { text: '320ms → 140ms', strong: true }])
    expect(strongParts('승인 성공률 99.98%를 지켰어요', '장애 없는 결제를 만드는 데 집중해 왔어요.')).toEqual([{ text: '승인 성공률 ' }, { text: '99.98%', strong: true }, { text: '를 지켰어요' }])
    expect(strongParts('p95 응답, 3가지 방식', '응답 방식')).toEqual([{ text: 'p95 응답, 3가지 방식' }])
  })

  it('leaves a number that the removed line already had', () => {
    expect(strongParts('3년간 운영, 실패율 2.1% → 0.3%', '3년간 운영')).toEqual([{ text: '3년간 운영, 실패율 ' }, { text: '2.1% → 0.3%', strong: true }])
  })

  it('bolds nothing without a removed line before it', () => {
    expect(strongParts('결제 승인 p95 320ms → 140ms')).toEqual([{ text: '결제 승인 p95 320ms → 140ms' }])
  })

  it('bolds the word a reorder moved, not the words that stayed in place or arrived new', () => {
    expect(strongParts('Kafka · Kotlin · Spring Boot · MySQL', 'Java · Spring Boot · MySQL · Kafka')).toEqual([{ text: 'Kafka', strong: true }, { text: ' · Kotlin · Spring Boot · MySQL' }])
  })

  it('does not bold a word two unrelated sentences happen to share', () => {
    expect(strongParts('피크 트래픽에서도 결제 승인 성공률을 지켰어요.', '트래픽이 몰리는 기간에도 결제 장애를 줄였어요.')).toEqual([{ text: '피크 트래픽에서도 결제 승인 성공률을 지켰어요.' }])
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
    { sign: '+', text: '- 모아페이 · 백엔드 엔지니어 · 2022.03 – 현재' },
  ]
  const rows = reviewRows(lines)

  it('reads the markdown lines of the whole document', () => {
    expect(rows.map((r) => r.kind)).toEqual(['title', 'headline', 'section', 'role', 'text', 'text', 'text', 'text', 'role'])
    expect(text(rows[0]!)).toBe('김서준')
    expect(text(rows[1]!)).toBe('결제 시스템을 만드는 백엔드 개발자 · 4년차')
  })

  it('splits a role line from its date', () => {
    expect(text(rows[3]!)).toBe('모아페이 · 백엔드 엔지니어')
    expect(rows[3]!.date).toBe('2022.03 – 현재')
  })

  it('keeps each changed line as its own row with its sign, a moved line as an added one', () => {
    expect(rows.slice(4, 8).map((r) => r.sign)).toEqual(['-', '+', '+', '+'])
    expect(text(rows[5]!)).toBe('결제 승인 API 재설계, p95 320ms → 140ms')
    expect(rows[5]!.parts.filter((p) => p.strong).map((p) => p.text)).toEqual(['320ms → 140ms'])
    expect(rows[4]!.parts.some((p) => p.strong)).toBe(false)
  })

  it('keeps the date of a changed role row', () => {
    expect(rows[8]).toMatchObject({ kind: 'role', sign: '+', date: '2022.03 – 현재' })
    expect(text(rows[8]!)).toBe('모아페이 · 백엔드 엔지니어')
  })

  it('draws what the server sends today: one removed block and one added block with no document around them', () => {
    const only = reviewRows([{ sign: '-', text: '결제 API 개발' }, { sign: '+', text: '결제 승인 API 재설계\nKafka 파이프라인' }])
    expect(only.map((r) => [r.sign, text(r)])).toEqual([['-', '결제 API 개발'], ['+', '결제 승인 API 재설계'], ['+', 'Kafka 파이프라인']])
  })
})
