import type { Posting } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { QUICK_STARTS } from '../constants'
import { quickStartFrom } from '../utils/quick-start-data'

vi.mock('@/features/my', async () => {
  const utils = await import('../../my/utils')
  return { dday: utils.dday, givenName: utils.givenName, stageTone: utils.stageTone, timeAgo: utils.timeAgo }
})

const input = { url: '', chips: [] as string[], option: false, task: '', custom: '' }

describe('점수 올리기', () => {
  it('sends intent boost only when a doc and a posting are picked', () => {
    const qs = QUICK_STARTS.find((q) => q.key === 'boost')
    expect(qs).toMatchObject({
      label: '점수 올리기',
      title: '어떤 서류의 점수를 올릴까요?',
      description: '공고에 맞춰 서류를 여러 번 고치며 적합도 점수를 올려요. 최대 5번까지 해요.',
      action: '점수 올리기 시작',
      docLabel: '올릴 서류',
      listLabel: '공고',
    })
    expect(qs!.start({ ...input, picked: [], doc: '이력서.pdf' })).toBeFalsy()
    expect(qs!.start({ ...input, picked: [{ id: 'p', over: '모아페이', title: '백엔드' }], doc: undefined })).toBeFalsy()
    expect(qs!.start({ ...input, picked: [{ id: 'p', over: '모아페이', title: '백엔드' }], doc: '이력서.pdf' })).toEqual({
      title: '모아페이 점수 올리기',
      message: '모아페이 백엔드 공고에 맞춰 이력서.pdf 점수를 올려 주세요',
      intent: 'boost',
    })
  })

  it('fills the posting list from bookmarks', () => {
    const bookmarks = [{ id: 'a', company: '모아페이', title: '백엔드', location: '서울', deadline: null }] as Posting[]
    const data = quickStartFrom('boost', { bookmarks, doc: '이력서.pdf' })
    expect(data.doc).toBe('이력서.pdf')
    expect(data.items.map((i) => [i.id, i.over, i.selected])).toEqual([['a', '모아페이', true]])
  })
})
