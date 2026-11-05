import { describe, expect, it } from 'vitest'
import { applyBody, applyDoc, splitApplyDocs } from './apply-doc'

const item = { id: 's1', fileName: '이력서.pdf', mimeType: 'application/pdf', size: 1, pageCount: null }

describe('applyDoc', () => {
  it('labels AI documents and uploads from the sources list', () => {
    const createdAt = new Date(2026, 9, 12).toISOString()
    expect(applyDoc({ ...item, origin: 'AI', createdAt })).toEqual({ id: 's1', name: '이력서.pdf', ai: true, note: '에이전트로 맞춘 서류 · 10월 12일', kind: null, date: createdAt })
    expect(applyDoc({ ...item, origin: 'UPLOAD', createdAt: null })).toEqual({ id: 's1', name: '이력서.pdf', ai: false, note: '원본', kind: null, date: null })
  })

  it('says 오늘 when the document was made today', () => {
    const now = new Date(2026, 9, 12, 15, 0)
    const createdAt = new Date(2026, 9, 12, 9, 0).toISOString()
    expect(applyDoc({ ...item, origin: 'AI', createdAt }, now).note).toBe('에이전트로 맞춘 서류 · 오늘')
  })

  it('splitApplyDocs puts portfolios into extras', () => {
    const resume = applyDoc({ ...item, origin: 'UPLOAD', createdAt: null, kind: 'RESUME' })
    const portfolio = applyDoc({ ...item, id: 's2', origin: 'UPLOAD', createdAt: null, kind: 'PORTFOLIO' })
    expect(splitApplyDocs([resume, portfolio])).toEqual({ main: [resume], extras: [portfolio] })
  })

  it('applyBody sends AI docs as documentIds and uploads as sourceIds', () => {
    const ai = applyDoc({ ...item, origin: 'AI', createdAt: null })
    const upload = applyDoc({ ...item, id: 's2', origin: 'UPLOAD', createdAt: null, kind: 'PORTFOLIO' })
    expect(applyBody(ai, [upload])).toEqual({ documentIds: ['s1'], sourceIds: ['s2'] })
  })
})
