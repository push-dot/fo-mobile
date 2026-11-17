import { describe, expect, it } from 'vitest'
import { tableColumns } from '../utils/table-columns'
import { planTable } from '../utils/plan-table'
import type { PlanItem } from '../types'

// The bot bubble inside is (402 - 40) * 0.88 - 30 wide on the boards' 402 pt viewport; the boards' column starts are read from the v489 boards (`.mdt` pads every column but the last 14, ChatPh2 x74 and x176, ChatPh1Feedback x87 and x190).
const INNER = (402 - 40) * 0.88 - 30
const starts = (widths: number[]) => widths.reduce<number[]>((all, w) => [...all, all[all.length - 1]! + w], [35]).slice(0, -1)

describe('tableColumns', () => {
  it('gives each column its widest cell and the last column the rest when the table has room (ChatPh2)', () => {
    const head = ['구분', '섹션', '바꿀 점']
    const rows = [['강화', '경력 · 모아페이', '승인 API 성과를 숫자로'], ['수정', '기술 스택', 'Kafka 경험을 맨 앞으로'], ['추가', '프로젝트', 'payment-retry-lab'], ['축소', '사내 동아리', '공고와 연관이 낮아요']]
    const [, b, c] = starts(tableColumns(head, rows, INNER))
    expect(b).toBeCloseTo(74.1, 0)
    expect(c).toBeCloseTo(177.1, 0)
  })

  it('shrinks the columns in proportion to their widest cell, none below its longest word (ChatPh1Feedback)', () => {
    const head = ['항목', '지금', '고칠 점']
    const rows = [['키워드', 'Kafka, 정산 배치가 없어요', '경험 문장에 직접 넣기'], ['도메인', '정산 경험이 약해요', 'payment-retry-lab을 정산 맥락으로'], ['성과', '숫자가 부족해요', '승인 API 개선을 수치로']]
    const widths = tableColumns(head, rows, INNER)
    const [, b, c] = starts(widths)
    expect(b).toBeCloseTo(86.8, 0)
    expect(c).toBeCloseTo(190.4, 0)
    expect(widths.reduce((x, y) => x + y, 0)).toBeCloseTo(INNER, 5)
  })
})

describe('planTable', () => {
  const plan = (id: string): PlanItem => ({ type: 'plan', id, title: '', meta: '', rows: [], keywords: [] })

  it('reads the feedback head from the kind at the end of a scoped id', () => {
    expect(planTable(plan('ph1-fit-feedback')).head).toEqual(['항목', '지금', '고칠 점'])
    expect(planTable(plan('ph1-fit-strategy')).head).toEqual(['구분', '섹션', '바꿀 점'])
  })
})
