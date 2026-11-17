import { describe, expect, it } from 'vitest'
import { quickStartsFor } from '../utils/quick-start-chips'

describe('quickStartsFor', () => {
  it('lists the Push Bot chips in the previous design order, 부족한 점 찾기 opening its own sheet', () => {
    const chips = quickStartsFor('push')
    expect(chips.map((c) => c.label)).toEqual([
      '공고 링크로 맞추기', '나에게 맞는 공고 찾기', '부족한 점 찾기', '적합도 보기', '점수 올리기', '마감 임박 공고 정리', '지원 현황 정리',
      '캘린더 관리', '허브 프로필 다듬기', '경험 만들기', '제안 답장 쓰기', '커피챗 제안 쓰기', '커리어 글 쓰기',
    ])
    expect(chips.find((c) => c.label === '부족한 점 찾기')).toMatchObject({ key: 'gap', icon: 'qs-gap' })
  })

  it('lists the company Bot chips as in ChatBotOnboard: 적합도 보기, 부족한 점 찾기, 점수 올리기, 경험 만들기', () => {
    const chips = quickStartsFor('company')
    expect(chips.map((c) => c.label)).toEqual(['적합도 보기', '부족한 점 찾기', '점수 올리기', '경험 만들기'])
    expect(chips[1]).toMatchObject({ key: 'gap', icon: 'qs-gap' })
  })
})
