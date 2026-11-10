import { beforeEach, describe, expect, it } from 'vitest'
import { TERM_DOCUMENTS, TERM_ROWS, isTermKey, type TermKey } from './constants'
import { useTermsConsent, usePhoneAuth } from './stores'

describe('usePhoneAuth', () => {
  it('keeps the social provider for the email pill until cleared', () => {
    usePhoneAuth.getState().beginSocial('pending', 'seojun.kim@gmail.com', 'google')
    expect(usePhoneAuth.getState()).toMatchObject({ mode: 'social', email: 'seojun.kim@gmail.com', provider: 'google' })
    usePhoneAuth.getState().beginPhone()
    expect(usePhoneAuth.getState().provider).toBeNull()
  })
})

describe('useTermsConsent', () => {
  beforeEach(() => useTermsConsent.getState().reset())

  it('agreeing to a term checks only that term and keeps it checked', () => {
    useTermsConsent.getState().agree('privacy')
    expect(useTermsConsent.getState().checked).toEqual({ age14: false, serviceTerms: false, privacy: true, marketing: false })
    useTermsConsent.getState().agree('privacy')
    expect(useTermsConsent.getState().checked.privacy).toBe(true)
  })

  it('toggle-all checks everything, then clears it once everything is checked', () => {
    useTermsConsent.getState().toggleAll()
    expect(Object.values(useTermsConsent.getState().checked).every(Boolean)).toBe(true)
    useTermsConsent.getState().toggleAll()
    expect(Object.values(useTermsConsent.getState().checked).some(Boolean)).toBe(false)
  })

  it('opens a text only for the rows that have one', () => {
    expect(TERM_ROWS.filter((row) => isTermKey(row.id)).map((row) => row.id)).toEqual(['serviceTerms', 'privacy', 'marketing'])
    expect(TERM_ROWS.filter((row) => isTermKey(row.id)).every((row) => TERM_DOCUMENTS[row.id as TermKey].articles.length > 0)).toBe(true)
  })

  it('opens the collection consent that lists employer email sign-up items', () => {
    const rows = TERM_DOCUMENTS.privacy.articles
      .flatMap((article) => article.blocks)
      .flatMap((block) => (block.kind === 'table' ? block.rows : []))
    expect(rows.some((row) => row.join(' ').includes('이메일 주소, 비밀번호(되돌릴 수 없게 암호화해 저장), 이름, 약관 동의 기록'))).toBe(true)
  })

  it('accepts only own term keys, not inherited object properties or other values', () => {
    expect(['toString', 'constructor', '__proto__', 'age14', '', undefined, 1].map(isTermKey)).toEqual(Array(7).fill(false))
    expect(isTermKey('privacy')).toBe(true)
  })
})
