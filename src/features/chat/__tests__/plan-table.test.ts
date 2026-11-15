import { describe, expect, it } from 'vitest'
import type { PlanItem } from '../types'
import { blueprintList, isBlueprints, planKeywords, planTable } from '../utils/plan-table'

const plan = (over: Partial<PlanItem>): PlanItem => ({ type: 'plan', id: 'strategy', title: '', meta: '', rows: [{ tag: '강화', label: '경력 · 모아페이', note: '성과를 숫자로' }], keywords: [], ...over })

describe('planTable', () => {
  it('draws the feedback and the strategy as tables with their own heads (ChatPh1Feedback, ChatPh2)', () => {
    expect(planTable(plan({ id: 'feedback' })).head).toEqual(['항목', '지금', '고칠 점'])
    expect(planTable(plan({})).head).toEqual(['구분', '섹션', '바꿀 점'])
    expect(planTable(plan({})).rows).toEqual([['강화', '경력 · 모아페이', '성과를 숫자로']])
  })
  it('draws the blueprints as a list with the conditional one marked and a line that opens the reasons (ChatPh2XBlueprints)', () => {
    const rows = [
      { tag: '통과', label: '재시도 큐', note: '안정성' },
      { tag: '조건부', label: '아웃박스', note: '무결성' },
    ]
    expect(isBlueprints(plan({ rows }))).toBe(true)
    expect(blueprintList(plan({ rows }))).toEqual({ lines: ['재시도 큐', '아웃박스 (조건부)'], detail: { text: '기획서 자세히 보기 ›', more: '재시도 큐 · 안정성\n아웃박스 · 무결성' } })
  })
  it('counts the keywords a strategy adds on one grey line that a tap opens, and none when it adds none', () => {
    expect(planKeywords(plan({ keywords: ['Kafka', '장애 대응'] }))).toEqual({ text: '넣을 키워드 2개 보기 ›', more: '넣을 키워드 Kafka · 장애 대응' })
    expect(planKeywords(plan({}))).toBeUndefined()
  })
})
