import { describe, expect, it } from 'vitest'
import { displayName, extensionOf } from './display-name'

describe('displayName', () => {
  it.each([
    ['김서준_백엔드_이력서.pdf', '김서준_백엔드_이력서'],
    ['경력기술서_모아페이.DOCX', '경력기술서_모아페이'],
    ['이력서.final.pdf', '이력서.final'],
    ['지원서.hwpx', '지원서'],
    ['사진.JPEG', '사진'],
  ])('drops the extension of %s', (name, shown) => expect(displayName(name)).toBe(shown))

  it.each(['포트폴리오 v2.1', '모아페이', 'a.b.c', '.pdf', ''])('keeps %s', (name) => expect(displayName(name)).toBe(name))
})

describe('extensionOf', () => {
  it('returns what displayName drops', () => {
    expect(extensionOf('김서준_이력서.pdf')).toBe('.pdf')
    expect(extensionOf('모아페이')).toBe('')
  })
})
