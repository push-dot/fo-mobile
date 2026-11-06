import { describe, expect, it } from 'vitest'
import { RESULT_VARIANT, applyText, profileSaveCopy, resultActionsFor, resultButtons, resultChrome, resultMeta, resultTitle } from '../utils/result-card'

const file = {
  source: 'external' as const,
  company: '모아페이',
  fileName: '김서준_모아페이_백엔드.pdf',
  pageLine: 'A4 1쪽 · 186KB',
  savedLine: '내 서류에 자동 저장됨',
  cardMeta: 'A4 1쪽 · 186KB · 내 서류에 자동 저장됨',
  documentId: 'src-1',
  actions: [
    { id: 'apply', label: '모아페이에 바로 지원하기' },
    { id: 'convert', label: '프로필로 전환', method: 'POST', path: '/api/v1/documents/src-1/profile' },
  ],
}

const profile = {
  source: 'profile' as const,
  company: '모아페이',
  name: '김서준',
  headline: '백엔드 엔지니어',
  title: '김서준 · 백엔드 엔지니어',
  subtitle: 'Push 프로필 · 방금 수정',
  documentId: 'd1',
  actions: [
    { id: 'apply', label: '모아페이에 바로 지원하기' },
    { id: 'view', label: '프로필 보기' },
  ],
}

describe('agent result cards', () => {
  it('shows the uploaded file meta and convert button, with no format badge', () => {
    expect(resultTitle(file)).toBe('김서준_모아페이_백엔드.pdf')
    expect(resultMeta(file)).toBe('A4 1쪽 · 186KB · 내 서류에 자동 저장됨')
    expect(resultButtons(file)).toEqual(['모아페이에 바로 지원하기', '프로필로 전환'])
    expect(resultButtons(file).join(' ')).not.toMatch(/PDF|DOCX|v1/)
    expect(resultChrome(file)).toEqual({ share: true, initials: null })
    expect(resultChrome({ ...file, documentId: '' })).toEqual({ share: false, initials: null })
  })

  it('shows the profile card and the view button', () => {
    expect(resultTitle(profile)).toBe('김서준 · 백엔드 엔지니어')
    expect(resultMeta(profile)).toBe('Push 프로필 · 방금 수정')
    expect(resultButtons(profile)).toEqual(['모아페이에 바로 지원하기', '프로필 보기'])
    expect(resultChrome(profile)).toEqual({ share: false, initials: '서준' })
  })

  it('renders one button when apply is missing', () => {
    expect(resultButtons({ actions: [{ id: 'view', label: '프로필 보기' }, { id: 'share', label: '공유' }] })).toEqual(['프로필 보기'])
  })

  it('pre-confirm profile card', () => {
    const note = 'PDF는 Push 프로필에서 내보낼 수 있어요.'
    const copy = profileSaveCopy({ ...profile, pendingNote: note })
    expect(copy).toEqual({ title: 'Push 프로필에 저장했어요', body: note, buttons: ['프로필 보기'] })
    expect(resultTitle({ ...profile, pendingNote: note })).toBe('Push 프로필에 저장했어요')
    expect(profileSaveCopy(profile)).toBeNull()
  })

  it('keeps external meta to the page line when savedLine is absent', () => {
    const meta = resultMeta({ source: 'external', pageLine: 'A4 1쪽 · 186KB' })
    expect(meta).toBe('A4 1쪽 · 186KB')
    expect(meta).not.toContain('내 서류에 자동 저장됨')
  })

  it('picks the button look by action id, so a lone convert stays secondary', () => {
    expect(RESULT_VARIANT).toEqual({ apply: 'primary', convert: 'secondary', view: 'secondary' })
  })

  it('hides the buttons while the card waits on an approval, or while a profile save is pending', () => {
    expect(resultActionsFor(file)).toHaveLength(2)
    expect(resultActionsFor(file, true)).toEqual([])
    expect(resultActionsFor({ ...profile, pendingNote: 'x' })).toEqual([])
  })

  it('does not say "에 바로 지원해 줘" without a company', () => {
    expect(applyText('모아페이')).toBe('모아페이에 바로 지원해 줘')
    expect(applyText()).toBe('바로 지원해 줘')
  })
})
