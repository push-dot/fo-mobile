import type { Profile } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { mapEvent } from '../utils/stream'
import { restorePatch } from '../utils/profile-undo'

const profile = (patch: Partial<Profile> = {}) =>
  ({ userId: 'u', displayName: '김서준', avatarUrl: null, headline: '백엔드 개발자', jobCategory: 'dev', tenureYears: 3, careerStatus: null, openToOffers: false, intro: '소개', careers: [], skills: ['Kotlin'], followerCount: 0, resumeSourceId: null, updatedAt: 'a', ...patch }) as Profile

describe('profile undo', () => {
  it('sends back only the fields the run changed, with their old values', () => {
    const before = profile()
    const after = profile({ headline: '시니어 백엔드', skills: ['Kotlin', 'Spring'], updatedAt: 'b', followerCount: 4 })
    expect(restorePatch(before, after)).toEqual({ headline: '백엔드 개발자', skills: ['Kotlin'] })
  })

  it('is empty when nothing the run may change moved', () => {
    expect(restorePatch(profile(), profile({ updatedAt: 'b' }))).toEqual({})
  })
})

describe('result gate without a question', () => {
  it('draws nothing when the server sends the profile result gate with auto set', () => {
    const present = { type: 'choice' as const, id: 'present', gate: 'present', auto: true, recommended: 'done', options: [{ id: 'done', label: '확인했어요' }] }
    expect(mapEvent(present)).toEqual([])
  })
})
