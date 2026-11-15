import { describe, expect, it } from 'vitest'
import type { PlanItem } from '../types'
import { planKeywords, planTable } from '../utils/plan-table'

const plan = (over: Partial<PlanItem>): PlanItem => ({ type: 'plan', id: 'strategy', title: '', meta: '', rows: [{ tag: '강화', label: '경력 · 모아페이', note: '성과를 숫자로' }], keywords: [], ...over })

describe('planTable', () => {
  it('draws the feedback, the strategy and the blueprints as tables with their own heads (ChatPh1Feedback, ChatPh2, ChatPh2XBlueprints)', () => {
    expect(planTable(plan({ id: 'feedback' })).head).toEqual(['구분', '고칠 점', '이렇게 고쳐요'])
    expect(planTable(plan({})).head).toEqual(['구분', '섹션', '할 일'])
    expect(planTable(plan({ rows: [{ tag: '통과', label: '재시도 큐', note: '안정성' }] })).head).toEqual(['판정', '프로젝트', '근거'])
    expect(planTable(plan({})).rows).toEqual([['강화', '경력 · 모아페이', '성과를 숫자로']])
  })
  it('names the keywords a strategy adds on one grey line, and none when it adds none', () => {
    expect(planKeywords(plan({ keywords: ['Kafka', '장애 대응'] }))).toBe('넣을 키워드 Kafka · 장애 대응')
    expect(planKeywords(plan({}))).toBeUndefined()
  })
})
