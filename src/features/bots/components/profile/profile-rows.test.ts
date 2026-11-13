import { describe, expect, it } from 'vitest'
import {
  DELETE_BODY,
  allowedA11y,
  allowedSheetTitle,
  colorA11y,
  deleteTitle,
  GRANT_INTRO,
  grantMeta,
  profileGroups,
  revokeA11y,
  revokeToast,
} from './profile-rows'

const ids = (kind: 'push' | 'company', over: Partial<Parameters<typeof profileGroups>[0]> = {}) =>
  profileGroups({ kind, posting: { deadline: new Date(2026, 10, 20) }, fitScore: 8.1, materialCount: 8, grantCount: 2, ...over }).flat().map((row) => row.id)

describe('bot profile rows', () => {
  it('hides colour and delete on Push Bot', () => {
    expect(ids('push')).toEqual(['posting', 'fit', 'materials', 'allowed', 'notify'])
  })

  it('adds the companies row after the allowed sites on the Push Bot only', () => {
    expect(ids('push', { companyCount: 6 })).toEqual(['posting', 'fit', 'materials', 'allowed', 'companies', 'notify'])
    expect(ids('push', { companyCount: 0 })).not.toContain('companies')
    expect(ids('company', { companyCount: 6 })).not.toContain('companies')
    expect(profileGroups({ kind: 'push', posting: null, fitScore: null, materialCount: 23, grantCount: 2, companyCount: 6 })[0]?.at(-1)).toEqual({ id: 'companies', label: '회사', value: '6개' })
  })

  it('hides a row whose fact is missing, and the allow row when nothing is allowed', () => {
    expect(ids('company', { posting: null, fitScore: null, materialCount: null, grantCount: 0 })).toEqual(['color', 'notify', 'delete'])
  })

  it('formats the posting, fit, materials, and allow rows', () => {
    const rows = profileGroups({
      kind: 'company',
      posting: { deadline: null },
      fitScore: 7.4,
      materialCount: 8,
      grantCount: 2,
    }).flat()
    expect(rows).toEqual([
      { id: 'posting', label: '공고', value: '상시 채용' },
      { id: 'fit', label: '적합도', value: '7.4' },
      { id: 'materials', label: '자료', value: '8개' },
      { id: 'allowed', label: '허용한 사이트', value: '2개' },
      { id: 'color', label: '색' },
      { id: 'notify', label: '알림' },
      { id: 'delete', label: 'Bot 삭제' },
    ])
    expect(profileGroups({ kind: 'company', posting: { deadline: new Date(2026, 10, 20) }, fitScore: 8.1, materialCount: 1, grantCount: 1 }).flat()[0]).toMatchObject({ value: '11월 20일 마감' })
    expect(allowedA11y(2)).toBe('허용한 사이트 2개')
    expect(allowedSheetTitle(2)).toBe('허용한 사이트 2')
  })

  it('labels a grant, the intro, the toast, and the delete question from the boards', () => {
    expect(grantMeta('2026-11-03', 'posting')).toBe('11월 3일 허용 · 채용 공고')
    expect(grantMeta('2026-11-05', 'company')).toBe('11월 5일 허용 · 회사 소개')
    expect(grantMeta('2026-10-29', 'other')).toBe('10월 29일 허용')
    expect(GRANT_INTRO).toBe('Bot이 묻지 않고 읽는 사이트예요.')
    expect(revokeToast('careers.moapay.co.kr')).toBe('careers.moapay.co.kr 허용을 해제했어요')
    expect(revokeA11y('careers.moapay.co.kr')).toBe('careers.moapay.co.kr 허용 해제')
    expect(deleteTitle('모아페이')).toBe('모아페이 Bot을 삭제할까요?')
    expect(DELETE_BODY).toBe('이 Bot과 나눈 대화와 작업 기록이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일은 그대로 남아요.')
    expect(colorA11y(0)).toBe('색 1')
  })
})
