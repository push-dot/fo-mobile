import { describe, expect, it } from 'vitest'
import {
  DELETE_BODY,
  colorA11y,
  deleteTitle,
  profileGroups,
} from './profile-rows'

const ids = (kind: 'push' | 'company', over: Partial<Parameters<typeof profileGroups>[0]> = {}) =>
  profileGroups({ kind, posting: { deadline: new Date(2026, 10, 20) }, fitScore: 8.1, materialCount: 8, ...over }).flat().map((row) => row.id)

describe('bot profile rows', () => {
  it('hides colour and delete on Push Bot', () => {
    expect(ids('push')).toEqual(['posting', 'fit', 'materials', 'notify'])
  })

  it('adds the companies row after the materials on the Push Bot only', () => {
    expect(ids('push', { companyCount: 6 })).toEqual(['posting', 'fit', 'materials', 'companies', 'notify'])
    expect(ids('push', { companyCount: 0 })).not.toContain('companies')
    expect(ids('company', { companyCount: 6 })).not.toContain('companies')
    expect(profileGroups({ kind: 'push', posting: null, fitScore: null, materialCount: 23, companyCount: 6 })[0]?.at(-1)).toEqual({ id: 'companies', label: '회사', value: '6개' })
  })

  it('hides a row whose fact is missing', () => {
    expect(ids('company', { posting: null, fitScore: null, materialCount: null })).toEqual(['color', 'notify', 'delete'])
  })

  it('formats the posting, fit, and materials rows', () => {
    const rows = profileGroups({
      kind: 'company',
      posting: { deadline: null },
      fitScore: 7.4,
      materialCount: 8,
    }).flat()
    expect(rows).toEqual([
      { id: 'posting', label: '공고', value: '상시 채용' },
      { id: 'fit', label: '적합도', value: '7.4' },
      { id: 'materials', label: '자료', value: '8개' },
      { id: 'color', label: '색' },
      { id: 'notify', label: '알림' },
      { id: 'delete', label: 'Bot 삭제' },
    ])
    expect(profileGroups({ kind: 'company', posting: { deadline: new Date(2026, 10, 20) }, fitScore: 8.1, materialCount: 1 }).flat()[0]).toMatchObject({ value: '11월 20일 마감' })
  })

  it('labels the delete question from the boards', () => {
    expect(deleteTitle('모아페이')).toBe('모아페이 Bot을 삭제할까요?')
    expect(DELETE_BODY).toBe('기록이 지워지고 되돌릴 수 없어요.')
    expect(colorA11y(0)).toBe('색 1')
  })
})
